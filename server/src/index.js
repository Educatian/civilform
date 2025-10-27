'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import utilities
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
const RevitAnalyzer = require('./lib/revit-analyzer');
const {
  Logger,
  Errors,
  errorHandler,
  asyncHandler,
  requestIdMiddleware,
  performanceMiddleware,
  validateRequest
} = require('./lib/error-handler');

const app = express();

// =============================================
// MIDDLEWARE
// =============================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestIdMiddleware);
app.use(performanceMiddleware);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 100 * 1024 * 1024 // 100 MB per file
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Accept both images and Revit files - specific validation per endpoint
    const allowed = ['.rvt', '.rfa', '.adt', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(Errors.InvalidFormat(`Invalid file format: ${ext}. Allowed: .rvt, .rfa, .adt, .jpg, .jpeg, .png, .webp, .gif`));
    }
  }
});

// Separate multer for evaluate endpoint (images only)
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 50 * 1024 * 1024 // 50 MB per image
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedImages = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowedImages.includes(ext)) {
      cb(null, true);
    } else {
      cb(Errors.InvalidFormat(`Only image files allowed (.jpg, .jpeg, .png, .webp, .gif). Got: ${ext}`));
    }
  }
});

// Separate multer for convert endpoint (Revit files only)
const uploadRevit = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 100 * 1024 * 1024 // 100 MB per file
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedRevit = ['.rvt', '.rfa', '.adt'];
    if (allowedRevit.includes(ext)) {
      cb(null, true);
    } else {
      cb(Errors.InvalidFormat(`Only Revit files allowed (.rvt, .rfa, .adt). Got: ${ext}`));
    }
  }
});

// In-memory storage for conversion job tracking
const conversionJobs = new Map();

// =============================================
// HEALTH CHECK
// =============================================

app.get('/health', asyncHandler(async (_req, res) => {
  try {
    // Verify Autodesk token can be obtained
    const token = await getAccessToken();
    
    Logger.info('HEALTH', 'Health check passed');
    
    res.json({ 
      ok: true, 
      message: 'Server running with Autodesk API',
      autodesk: token ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    Logger.error('HEALTH', 'Health check failed', err);
    throw Errors.ServiceUnavailable('Autodesk API unavailable', { error: err.message });
  }
}));

// =============================================
// AI EVALUATION ENDPOINT
// =============================================

app.post('/evaluate', uploadImages.array('images', 3), asyncHandler(async (req, res) => {
  const { studentId, courseCode, selfDescription } = req.body;
  const files = Array.isArray(req.files) ? req.files : [];

  Logger.info('EVALUATE', 'Request received', {
    studentId,
    courseCode,
    filesCount: files.length,
    requestId: req.id
  });

  // Validate required fields
  try {
    validateRequest(['studentId', 'courseCode', 'selfDescription'], req.body);
  } catch (err) {
    throw err;
  }

  if (files.length === 0) {
    throw Errors.BadRequest('At least one image file is required');
  }

  if (selfDescription.length < 20) {
    throw Errors.BadRequest('Self-description must be at least 20 characters');
  }

  // Convert file buffers to image data for Gemini
  const imageData = files.map(f => {
    // Detect MIME type based on file extension
    const ext = path.extname(f.originalname).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    // Only allow image formats for Gemini Vision
    const allowedImageFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedImageFormats.includes(ext)) {
      Logger.warn('EVALUATE', `Invalid image format: ${ext}. File: ${f.originalname}`);
      throw Errors.BadRequest(`Invalid image format: ${ext}. Allowed: jpg, jpeg, png, webp, gif`);
    }
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    
    Logger.info('EVALUATE', `Processing image: ${f.originalname} (${mimeType})`);
    
    return {
      data: f.buffer.toString('base64'),
      mimeType
    };
  });

  // Call Gemini Vision for AI feedback
  Logger.info('EVALUATE', 'Calling Gemini Vision API...');
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

  Logger.info('EVALUATE', `✅ Complete - Score: ${aiFeedback.score}/100`);
  res.json(responseData);
}));

// =============================================
// REVIT FILE CONVERSION ENDPOINTS
// =============================================

/**
 * POST /convert
 * Upload Revit files, analyze, and submit conversion jobs
 */
app.post('/convert', uploadRevit.array('images', 3), asyncHandler(async (req, res) => {
  const { studentId, courseCode } = req.body;
  const files = Array.isArray(req.files) ? req.files : [];

  Logger.info('CONVERT', 'Upload & submit request', {
    studentId,
    courseCode,
    filesCount: files.length,
    requestId: req.id
  });

  if (!files.length) {
    throw Errors.BadRequest('No files uploaded');
  }

  try {
    validateRequest(['studentId', 'courseCode'], req.body);
  } catch (err) {
    throw err;
  }

  // Initialize bucket (create if not exists)
  const bucketKey = process.env.AUTODESK_OSS_BUCKET_KEY;
  Logger.info('CONVERT', `Initializing bucket: ${bucketKey}`);
  
  await createOSSBucket(bucketKey, 'temporary');

  // Upload files and create conversion jobs
  const jobs = [];
  const analyses = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    Logger.info('CONVERT', `Analyzing file ${i + 1}/${files.length}: ${file.originalname}`);

    // Analyze Revit file
    const analysis = RevitAnalyzer.analyzeFile(file.buffer, file.originalname);
    analyses.push(RevitAnalyzer.generateReport(analysis));

    // Check if file analysis passed
    if (analysis.warnings.length > 0) {
      Logger.warn('CONVERT', `File analysis warnings for ${file.originalname}`, analysis.warnings);
    }

    Logger.info('CONVERT', `Uploading file ${i + 1}/${files.length}: ${file.originalname}`);

    // Upload to OSS
    const { urn } = await uploadToOSS(
      bucketKey,
      file.originalname,
      file.buffer
    );

    Logger.info('CONVERT', `File uploaded. Submitting conversion job...`);

    // Submit conversion job
    const job = await submitDerivativeJob(urn, ['ifc', 'pdf']);

    const jobRecord = {
      jobId: `job_${studentId}_${Date.now()}_${i}`,
      fileName: file.originalname,
      fileSize: file.size,
      urn,
      status: 'submitted',
      formats: ['ifc', 'pdf'],
      analysis: analysis,
      createdAt: new Date().toISOString()
    };

    jobs.push(jobRecord);
    conversionJobs.set(jobRecord.jobId, jobRecord);

    Logger.info('CONVERT', `✅ Job created: ${jobRecord.jobId}`);
  }

  Logger.info('CONVERT', `✅ ${jobs.length} job(s) submitted`);

  res.json({
    ok: true,
    jobs,
    analyses,
    message: `${jobs.length} file(s) submitted for conversion`
  });
}));

/**
 * GET /convert/:jobId
 * Check conversion job status and get file analysis
 */
app.get('/convert/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = conversionJobs.get(jobId);

  if (!job) {
    throw Errors.JobNotFound(`Job not found: ${jobId}`);
  }

  Logger.info('STATUS', `Checking job: ${jobId}`);

  // Check status with Autodesk API
  const manifest = await checkJobStatus(job.urn);

  const statusResponse = {
    jobId,
    fileName: job.fileName,
    fileSize: job.fileSize,
    status: manifest.status === 'success' ? 'completed' : 'inprogress',
    autodesk_status: manifest.status,
    progress: parseInt(manifest.progress) || 0,
    message: `Conversion ${manifest.status} (${manifest.progress})`,
    derivatives: manifest.derivatives || [],
    analysis: job.analysis ? RevitAnalyzer.generateReport(job.analysis) : null
  };

  // Update job record
  job.status = statusResponse.status;
  job.progress = statusResponse.progress;

  Logger.info('STATUS', `${jobId}: ${statusResponse.autodesk_status} (${statusResponse.progress}%)`);

  res.json(statusResponse);
}));

/**
 * GET /convert/:jobId/:format
 * Download converted file (ifc or pdf)
 */
app.get('/convert/:jobId/:format', asyncHandler(async (req, res) => {
  const { jobId, format } = req.params;
  const job = conversionJobs.get(jobId);

  if (!job) {
    throw Errors.JobNotFound(`Job not found: ${jobId}`);
  }

  // Validate format
  if (!['ifc', 'pdf'].includes(format)) {
    throw Errors.BadRequest(`Invalid format: ${format}. Allowed: ifc, pdf`);
  }

  Logger.info('DOWNLOAD', `Requesting ${format} for ${jobId}`);

  // Check if conversion is complete
  const manifest = await checkJobStatus(job.urn);
  
  if (manifest.status !== 'success') {
    return res.status(202).json({
      message: 'Conversion in progress',
      status: manifest.status,
      progress: parseInt(manifest.progress) || 0,
      timestamp: new Date().toISOString()
    });
  }

  // Get download URL
  const downloadUrl = await getDerivativeUrl(job.urn, format);

  Logger.info('DOWNLOAD', `✅ ${format} ready for ${jobId}`);

  res.json({
    ok: true,
    jobId,
    fileName: job.fileName,
    format,
    downloadUrl: downloadUrl.downloadUrl,
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}));

// =============================================
// REVIT FILE ANALYSIS ENDPOINT
// =============================================

/**
 * POST /analyze
 * Analyze Revit file without conversion
 */
app.post('/analyze', uploadRevit.array('images', 3), asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];

  Logger.info('ANALYZE', `Analyzing ${files.length} file(s)`);

  if (files.length === 0) {
    throw Errors.BadRequest('No files provided for analysis');
  }

  const analyses = files.map(file => {
    const analysis = RevitAnalyzer.analyzeFile(file.buffer, file.originalname);
    return RevitAnalyzer.generateReport(analysis);
  });

  res.json({
    ok: true,
    analyses,
    timestamp: new Date().toISOString()
  });
}));

// =============================================
// 404 HANDLER
// =============================================

app.use((_req, _res) => {
  throw Errors.BadRequest('Endpoint not found');
});

// =============================================
// ERROR HANDLING
// =============================================

app.use(errorHandler);

// =============================================
// START SERVER
// =============================================

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  Logger.info('SERVER', `🚀 CivilFo Evaluation Server running on http://localhost:${PORT}`);
  Logger.info('SERVER', `📝 Endpoints:`);
  Logger.info('SERVER', `   - POST http://localhost:${PORT}/evaluate (Gemini AI Evaluation)`);
  Logger.info('SERVER', `   - POST http://localhost:${PORT}/convert (Submit Revit files)`);
  Logger.info('SERVER', `   - GET  http://localhost:${PORT}/convert/:jobId (Check status)`);
  Logger.info('SERVER', `   - GET  http://localhost:${PORT}/convert/:jobId/:format (Download IFC/PDF)`);
  Logger.info('SERVER', `   - POST http://localhost:${PORT}/analyze (Analyze files)`);
  Logger.info('SERVER', `   - GET  http://localhost:${PORT}/health (Health check)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.warn('SERVER', 'SIGTERM received, shutting down gracefully...');
  server.close(() => {
    Logger.info('SERVER', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.warn('SERVER', 'SIGINT received, shutting down...');
  process.exit(0);
});

module.exports = app;


