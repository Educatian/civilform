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
// Note: multer field name is 'images' to match frontend FormData
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

    // Mock AI feedback with random variations
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
  console.log(`📝 Endpoint: POST http://localhost:${PORT}/evaluate`);
  console.log(`💚 Health: GET http://localhost:${PORT}/health\n`);
});
