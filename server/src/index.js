'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const { initializeFirebase, getFirestore, getStorageBucket } = require('./lib/firebase');
const { getGeminiModel, buildVisionPromptParts, parseGeminiJson } = require('./lib/gemini');

// Initialize external services
initializeFirebase();

const db = getFirestore();
const bucket = getStorageBucket();
const model = getGeminiModel();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer in-memory storage for up to 3 images
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 3,
        fileSize: 10 * 1024 * 1024 // 10 MB per image
    },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (.png, .jpg, .jpeg, .webp).'));
        }
    }
});

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

// POST /evaluate accepts multipart/form-data with up to 3 images under field name "images"
app.post('/evaluate', upload.array('images', 3), async (req, res) => {
    try {
        const { studentId, selfDescription, checklist, courseCode, rubric } = req.body;

        if (!studentId) {
            return res.status(400).json({ error: 'studentId is required' });
        }

        const timestampMs = Date.now();

        // Upload images to Cloud Storage if provided
        const files = Array.isArray(req.files) ? req.files : [];
        const uploadedUrls = [];
        for (let i = 0; i < Math.min(files.length, 3); i++) {
            const file = files[i];
            const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const objectName = `revit_evaluations/${studentId}/${timestampMs}_${i}_${safeName}`;

            const gcsFile = bucket.file(objectName);
            await gcsFile.save(file.buffer, {
                contentType: file.mimetype,
                resumable: false,
                metadata: {
                    cacheControl: 'public, max-age=31536000'
                }
            });

            // Generate a signed URL (V4) valid for 7 days
            const [signedUrl] = await gcsFile.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000
            });
            uploadedUrls.push(signedUrl);
        }

        // Build Gemini Vision input parts
        const textContext = {
            selfDescription: selfDescription || '',
            checklist: checklist ? checklist : '',
            rubric: rubric ? rubric : ''
        };

        const imageParts = (files || []).slice(0, 3).map((f) => ({
            inlineData: { data: f.buffer.toString('base64'), mimeType: f.mimetype }
        }));

        const parts = buildVisionPromptParts(textContext, imageParts);

        // Call Gemini Vision
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        const response = await result.response;
        const text = response.text();
        const aiFeedback = parseGeminiJson(text);

        // Minimal response keys required
        const score = typeof aiFeedback.score === 'number' ? aiFeedback.score : null;
        const strengths = Array.isArray(aiFeedback.strengths) ? aiFeedback.strengths : [];
        const weaknesses = Array.isArray(aiFeedback.weaknesses) ? aiFeedback.weaknesses : [];

        // Persist to Firestore
        const docRef = await db.collection('revit_evaluations').add({
            studentId,
            modelImages: uploadedUrls,
            selfDescription: selfDescription || '',
            checklist: checklist ? checklist : '',
            aiFeedback,
            timestamp: new Date(timestampMs),
            courseCode: courseCode || null
        });

        res.json({
            ok: true,
            score,
            strengths,
            weaknesses,
            aiFeedback,
            modelImages: uploadedUrls,
            docId: docRef.id
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Evaluation error:', err);
        res.status(500).json({ error: 'Evaluation failed', details: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Evaluation server listening on http://localhost:${PORT}`);
});


