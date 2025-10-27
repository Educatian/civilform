'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import Autodesk and Gemini utilities
const {
  getAccessToken,
  createOSSBucket,
  uploadToOSS,
  submitDerivativeJob,
  checkJobStatus,
  getDerivativeUrl,
  deleteFromOSS
} = require('./lib/autodesk');

const { getGeminiVisionFeedback } = require('./lib/gemini');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 100 * 1024 * 1024 // 100 MB per file
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.rvt', '.rfa', '.adt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Revit files are allowed (.rvt, .rfa, .adt).'));
    }
  }
});

// In-memory storage for conversion job tracking
const conversionJobs = new Map();

// =============================================
// HEALTH CHECK
// =============================================

app.get('/health', async (_req, res) => {
  try {
    // Verify Autodesk token can be obtained
    const token = await getAccessToken();
    res.json({ 
      ok: true, 
      message: 'Server running with Autodesk API',
      autodesk: token ? 'connected' : 'disconnected'
    });
  } catch (err) {
    console.error('[SERVER] Health check error:', err.message);
    res.status(503).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

// =============================================
// AI EVALUATION ENDPOINT
// =============================================

app.post('/evaluate', upload.array('images', 3), async (req, res) => {
  try {
    const { studentId, courseCode, selfDescription } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    console.log('\n[EVALUATE] Request received');
    console.log(`  Student: ${studentId}, Course: ${courseCode}`);
    console.log(`  Description: ${selfDescription?.length || 0} chars`);
    console.log(`  Files: ${files.length}`);

    // Validation
    if (!studentId || !courseCode || !selfDescription || files.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: studentId, courseCode, selfDescription, images'
      });
    }

    if (selfDescription.length < 20) {
      return res.status(400).json({
        error: 'Self-description must be at least 20 characters'
      });
    }

    // Convert file buffers to image data for Gemini
    const imageData = files.map(f => ({
      data: f.buffer.toString('base64'),
      mimeType: 'image/jpeg' // Adjust based on actual file type
    }));

    // Call Gemini Vision for AI feedback
    console.log('[EVALUATE] Calling Gemini Vision API...');
    const aiFeedback = await getGeminiVisionFeedback(
      selfDescription,
      imageData
    );

    const responseData = {
      ok: true,
      score: aiFeedback.score,
      strengths: aiFeedback.strengths,
      weaknesses: aiFeedback.weaknesses,
      aiFeedback: aiFeedback,
      docId: `eval_${studentId}_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    console.log(`[EVALUATE] ✅ Complete - Score: ${aiFeedback.score}/100\n`);
    res.json(responseData);

  } catch (err) {
    console.error('[EVALUATE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// REVIT FILE CONVERSION ENDPOINTS
// =============================================

/**
 * POST /convert
 * Upload Revit files and submit conversion jobs
 */
app.post('/convert', upload.array('images', 3), async (req, res) => {
  try {
    const { studentId, courseCode } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    console.log('\n[CONVERT] Upload & submit request');
    console.log(`  Student: ${studentId}, Course: ${courseCode}`);
    console.log(`  Files to convert: ${files.length}`);

    if (!files.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Initialize bucket (create if not exists)
    const bucketKey = process.env.AUTODESK_OSS_BUCKET_KEY;
    console.log(`[CONVERT] Initializing bucket: ${bucketKey}`);
    await createOSSBucket(bucketKey, 'temporary');

    // Upload files and create conversion jobs
    const jobs = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[CONVERT] Uploading file ${i + 1}/${files.length}: ${file.originalname}`);

      // Upload to OSS
      const { urn } = await uploadToOSS(
        bucketKey,
        file.originalname,
        file.buffer
      );

      // Submit conversion job
      const job = await submitDerivativeJob(urn, ['ifc', 'pdf']);

      const jobRecord = {
        jobId: `job_${studentId}_${Date.now()}_${i}`,
        fileName: file.originalname,
        fileSize: file.size,
        urn,
        status: 'submitted',
        formats: ['ifc', 'pdf'],
        createdAt: new Date().toISOString()
      };

      jobs.push(jobRecord);
      conversionJobs.set(jobRecord.jobId, jobRecord);

      console.log(`[CONVERT] ✅ Job created: ${jobRecord.jobId}`);
    }

    console.log(`[CONVERT] ✅ ${jobs.length} job(s) submitted\n`);

    res.json({
      ok: true,
      jobs,
      message: `${jobs.length} file(s) submitted for conversion`
    });

  } catch (err) {
    console.error('[CONVERT] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /convert/:jobId
 * Check conversion job status
 */
app.get('/convert/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = conversionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: `Job not found: ${jobId}` });
    }

    console.log(`[STATUS] Checking job: ${jobId}`);

    // Check status with Autodesk API
    const manifest = await checkJobStatus(job.urn);

    const statusResponse = {
      jobId,
      fileName: job.fileName,
      status: manifest.status === 'success' ? 'completed' : 'inprogress',
      autodesk_status: manifest.status,
      progress: parseInt(manifest.progress) || 0,
      message: `Conversion ${manifest.status} (${manifest.progress})`,
      derivatives: manifest.derivatives || []
    };

    // Update job record
    job.status = statusResponse.status;
    job.progress = statusResponse.progress;

    console.log(`[STATUS] ${jobId}: ${statusResponse.autodesk_status} (${statusResponse.progress}%)`);

    res.json(statusResponse);

  } catch (err) {
    console.error('[STATUS] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /convert/:jobId/:format
 * Download converted file (ifc or pdf)
 */
app.get('/convert/:jobId/:format', async (req, res) => {
  try {
    const { jobId, format } = req.params;
    const job = conversionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: `Job not found: ${jobId}` });
    }

    console.log(`[DOWNLOAD] Requesting ${format} for ${jobId}`);

    // Check if conversion is complete
    const manifest = await checkJobStatus(job.urn);
    
    if (manifest.status !== 'success') {
      return res.status(202).json({
        message: 'Conversion in progress',
        status: manifest.status,
        progress: parseInt(manifest.progress) || 0
      });
    }

    // Get download URL
    const downloadUrl = await getDerivativeUrl(job.urn, format);

    console.log(`[DOWNLOAD] ✅ ${format} ready for ${jobId}`);

    res.json({
      ok: true,
      jobId,
      format,
      downloadUrl: downloadUrl.downloadUrl,
      status: 'ready'
    });

  } catch (err) {
    console.error('[DOWNLOAD] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// ERROR HANDLING
// =============================================

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// =============================================
// START SERVER
// =============================================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 CivilFo Evaluation Server running on http://localhost:${PORT}`);
  console.log(`\n📝 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/evaluate (Gemini AI Evaluation)`);
  console.log(`   - POST http://localhost:${PORT}/convert (Submit Revit files)`);
  console.log(`   - GET  http://localhost:${PORT}/convert/:jobId (Check status)`);
  console.log(`   - GET  http://localhost:${PORT}/convert/:jobId/:format (Download IFC/PDF)`);
  console.log(`\n💚 Health: GET http://localhost:${PORT}/health\n`);
});

module.exports = app;


