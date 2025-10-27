'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer in-memory storage for up to 3 files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 3,
    fileSize: 50 * 1024 * 1024 // 50 MB per file
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

// In-memory storage for conversion jobs
const conversionJobs = new Map();

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Mock server is running' });
});

// Mock POST /evaluate endpoint
app.post('/evaluate', upload.array('images', 3), async (req, res) => {
  try {
    const { studentId, courseCode, selfDescription } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    console.log('\n[MOCK] /evaluate request received');
    console.log(`[MOCK] Student ID: ${studentId}`);
    console.log(`[MOCK] Course: ${courseCode}`);
    console.log(`[MOCK] Description length: ${selfDescription?.length || 0} chars`);
    console.log(`[MOCK] Files uploaded: ${files.length}`);

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    // Simulate Gemini analysis delay
    console.log('[MOCK] Simulating AI analysis (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI feedback
    const mockFeedback = {
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        'Good structural element organization',
        'Proper use of Revit families and components',
        'Clear and consistent naming conventions',
        'Well-organized project structure and hierarchy'
      ],
      weaknesses: [
        'Some missing parameters in family definitions',
        'Could improve Level of Detail (LOD) consistency',
        'Minor coordination issues between disciplines'
      ],
      improvement_steps: [
        'Add additional shared parameters to enhance data richness across the model',
        'Review and standardize LOD specifications across all element types',
        'Perform comprehensive clash detection and resolve any remaining conflicts',
        'Document design assumptions and document modeling approach in BIM execution plan'
      ],
      technical_risk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    };

    // Mock storage URLs
    const modelImages = files.map((f, i) => 
      `https://storage.example.com/mock/${studentId}/${Date.now()}_${i}_${f.originalname}`
    );

    const responseData = {
      ok: true,
      score: mockFeedback.score,
      strengths: mockFeedback.strengths,
      weaknesses: mockFeedback.weaknesses,
      aiFeedback: mockFeedback,
      modelImages: modelImages,
      docId: `mock_${studentId}_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    console.log(`[MOCK] ✅ Analysis complete - Score: ${responseData.score}/100`);
    console.log(`[MOCK] Risk Level: ${mockFeedback.technical_risk}`);
    console.log('[MOCK] Response sent to client\n');

    res.json(responseData);
  } catch (err) {
    console.error('[MOCK] ❌ Evaluation error:', err.message);
    res.status(500).json({ 
      error: 'Evaluation failed', 
      details: err.message,
      type: err.name
    });
  }
});

// Model Derivative API endpoints

// POST /convert - Submit conversion job
app.post('/convert', upload.array('images', 3), async (req, res) => {
  try {
    const { studentId, courseCode } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    console.log('\n[DERIVATIVE] /convert request received');
    console.log(`[DERIVATIVE] Files to convert: ${files.length}`);

    if (files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    // Create mock conversion jobs
    const jobs = files.map((file, idx) => {
      const jobId = `job_${studentId}_${Date.now()}_${idx}`;
      const urn = Buffer.from(`revit_files/${file.originalname}-${Date.now()}`).toString('base64');
      
      conversionJobs.set(jobId, {
        filenam: file.originalname,
        urn,
        status: 'submitted',
        createdAt: Date.now(),
        formats: ['ifc', 'pdf']
      });

      return {
        jobId,
        fileName: file.originalname,
        urn,
        status: 'submitted'
      };
    });

    console.log(`[DERIVATIVE] ✅ ${jobs.length} conversion jobs created`);
    console.log('[DERIVATIVE] Response sent to client\n');

    res.json({
      ok: true,
      jobs,
      message: 'Files submitted for conversion'
    });
  } catch (err) {
    console.error('[DERIVATIVE] ❌ Conversion error:', err.message);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

// GET /convert/:jobId - Check conversion status
app.get('/convert/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = conversionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Simulate conversion progress (2-5 seconds)
    const elapsed = Date.now() - job.createdAt;
    let status = 'pending';
    let progress = 0;

    if (elapsed > 5000) {
      status = 'completed';
      progress = 100;
    } else if (elapsed > 3000) {
      status = 'processing';
      progress = 70;
    } else if (elapsed > 1000) {
      status = 'processing';
      progress = 40;
    } else {
      status = 'submitted';
      progress = 10;
    }

    const response = {
      jobId,
      fileName: job.fileName,
      urn: job.urn,
      status,
      progress,
      formats: status === 'completed' ? {
        ifc: `https://storage.example.com/converted/${jobId}.ifc`,
        pdf: `https://storage.example.com/converted/${jobId}.pdf`
      } : null,
      message: status === 'completed' ? 'Conversion complete' : `Conversion ${status} (${progress}%)`
    };

    console.log(`[DERIVATIVE] ✅ Status check: ${status} (${progress}%)`);
    res.json(response);
  } catch (err) {
    console.error('[DERIVATIVE] ❌ Status check error:', err.message);
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});

// GET /convert/:jobId/:format - Download converted file
app.get('/convert/:jobId/:format', (req, res) => {
  try {
    const { jobId, format } = req.params;
    const job = conversionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const elapsed = Date.now() - job.createdAt;
    if (elapsed < 5000) {
      return res.status(202).json({ 
        error: 'Conversion still in progress',
        status: 'processing'
      });
    }

    // Mock file download
    const mockContent = `Mock ${format.toUpperCase()} file for ${job.fileName}`;
    const fileName = `${job.fileName.replace(/\.[^.]*$/, '')}.${format}`;

    console.log(`[DERIVATIVE] ✅ Downloading ${format}: ${fileName}`);

    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(mockContent);
  } catch (err) {
    console.error('[DERIVATIVE] ❌ Download error:', err.message);
    res.status(500).json({ error: 'Download failed', details: err.message });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Mock Evaluation Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/evaluate (AI Evaluation)`);
  console.log(`   - POST http://localhost:${PORT}/convert (Revit → IFC/PDF)`);
  console.log(`   - GET http://localhost:${PORT}/convert/:jobId (Status)`);
  console.log(`   - GET http://localhost:${PORT}/convert/:jobId/:format (Download)`);
  console.log(`💚 Health: GET http://localhost:${PORT}/health\n`);
});
