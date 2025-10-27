## CivilFo Evaluation Server

### Setup
1. Copy `.env.example` to `.env` and fill values:
   - `GEMINI_API_KEY`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`
2. Install deps and run:

```bash
cd server
npm install
npm run dev
```

### API
`POST /evaluate` (multipart/form-data)
- fields: `studentId` (required), `selfDescription`, `checklist` (stringified JSON or text), `courseCode`, `rubric` (stringified JSON or text)
- files: `images` (0..3) of type png/jpg/jpeg/webp

Response:
```json
{
  "ok": true,
  "score": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "aiFeedback": {"score":0, "strengths":[], "weaknesses":[], "improvement_steps":[], "technical_risk":"low"},
  "modelImages": ["https://...signedUrl..."],
  "docId": "..."
}
```

### Notes
- Images are uploaded to Cloud Storage under `revit_evaluations/{studentId}/...` and signed URLs (7 days) are returned and saved.
- Firestore collection: `revit_evaluations` per the data model.

