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

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Mock server is running' });
});

// Mock POST /evaluate endpoint
app.post('/evaluate', upload.array('files', 3), async (req, res) => {
  try {
    const { studentId, courseCode, selfDescription } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    console.log(`[MOCK] Evaluating project for student: ${studentId}`);
    console.log(`[MOCK] Course: ${courseCode}`);
    console.log(`[MOCK] Description: ${selfDescription.substring(0, 50)}...`);
    console.log(`[MOCK] Files uploaded: ${files.length}`);

    // Simulate Gemini analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI feedback
    const mockFeedback = {
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      strengths: [
        'Good structural element organization',
        'Proper use of Revit families',
        'Clear naming conventions',
        'Well-organized project structure'
      ],
      weaknesses: [
        'Some missing parameters in family definitions',
        'Could improve LOD consistency',
        'Minor coordination issues'
      ],
      improvement_steps: [
        'Add additional parameters to improve data richness',
        'Review and standardize LOD specifications across all elements',
        'Perform comprehensive clash detection and resolve conflicts',
        'Document design assumptions and modeling approach'
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

    console.log(`[MOCK] Response score: ${responseData.score}`);
    res.json(responseData);
  } catch (err) {
    console.error('[MOCK] Evaluation error:', err);
    res.status(500).json({ error: 'Evaluation failed', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Mock Evaluation Server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: POST http://localhost:${PORT}/evaluate`);
  console.log(`💚 Health check: GET http://localhost:${PORT}/health\n`);
});
