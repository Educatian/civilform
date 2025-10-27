# CivilFo Evaluation Server

Production backend for civil engineering Revit project evaluation with Autodesk Model Derivative and Google Gemini integration.

## 🚀 Quick Start

### 1. Environment Configuration

Create `server/.env`:

```env
# Autodesk Authentication
AUTODESK_CLIENT_ID=your_client_id
AUTODESK_CLIENT_SECRET=your_client_secret
AUTODESK_OSS_BUCKET_KEY=civilfo-bucket-ce301

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=4000
NODE_ENV=development
```

**Get Credentials:**
- [Autodesk Developer Portal](https://forge.autodesk.com) → Create App → Copy Client ID/Secret
- [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key

### 2. Install & Run

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:4000`

## 📝 API Endpoints

### 1. Health Check

```bash
GET /health
```

Returns server status and Autodesk API connectivity.

### 2. AI Evaluation (Gemini Vision)

```bash
POST /evaluate
Content-Type: multipart/form-data

Form Fields:
- studentId (required): string (e.g., "20201234")
- courseCode (required): string (e.g., "CE301")
- selfDescription (required): string (min 20 chars)
- images (required): File[] (1-3 image files: .png, .jpg, .jpeg)
```

**Response:**

```json
{
  "ok": true,
  "score": 85,
  "strengths": [
    "Clear structural element organization",
    "Proper use of Revit families"
  ],
  "weaknesses": [
    "Some missing parameters",
    "LOD consistency issues"
  ],
  "aiFeedback": {
    "score": 85,
    "improvement_steps": [...],
    "technical_risk": "medium"
  },
  "docId": "eval_20201234_1730000000000",
  "timestamp": "2024-10-27T12:00:00Z"
}
```

### 3. Submit Revit Files for Conversion

```bash
POST /convert
Content-Type: multipart/form-data

Form Fields:
- studentId (required): string
- courseCode (required): string
- images (required): File[] (1-3 Revit files: .rvt, .rfa, .adt)
```

**Response:**

```json
{
  "ok": true,
  "jobs": [
    {
      "jobId": "job_20201234_1730000000000_0",
      "fileName": "project.rvt",
      "fileSize": 52428800,
      "urn": "dXJuOmFkc2sub3NzOm9iamVjdC9j...",
      "status": "submitted",
      "formats": ["ifc", "pdf"],
      "createdAt": "2024-10-27T12:00:00Z"
    }
  ],
  "message": "1 file(s) submitted for conversion"
}
```

### 4. Check Conversion Status

```bash
GET /convert/job_20201234_1730000000000_0
```

**Response:**

```json
{
  "jobId": "job_20201234_1730000000000_0",
  "fileName": "project.rvt",
  "status": "inprogress",
  "autodesk_status": "inprogress",
  "progress": 65,
  "message": "Conversion inprogress (65%)",
  "derivatives": [
    {
      "name": "project.ifc",
      "hasThumbnail": false,
      "status": "inprogress",
      "outputType": "ifc"
    }
  ]
}
```

Status values:
- `submitted` - Job queued
- `inprogress` - Converting (0-100%)
- `completed` - Ready for download
- `failed` - Conversion error

### 5. Download Converted File

```bash
GET /convert/job_20201234_1730000000000_0/ifc
GET /convert/job_20201234_1730000000000_0/pdf
```

**Response (when completed):**

```json
{
  "ok": true,
  "jobId": "job_20201234_1730000000000_0",
  "format": "ifc",
  "downloadUrl": "https://developer.api.autodesk.com/modelderivative/v2/designdata/...",
  "status": "ready"
}
```

**Response (still processing):**

```json
{
  "message": "Conversion in progress",
  "status": "inprogress",
  "progress": 75
}
```

## 🔌 Integration Details

### Autodesk Model Derivative API

- **RVT Upload**: OSS (Object Storage Service)
- **Formats**: `.rvt`, `.rfa`, `.adt`
- **Conversions**: IFC, PDF (2D/3D)
- **Typical Times**: 30s-10min depending on file size

See: [`AUTODESK_INTEGRATION.md`](./AUTODESK_INTEGRATION.md)

### Google Gemini Vision API

- **Model**: Gemini 2.0 Flash Exp
- **Input**: Image + Text description
- **Output**: JSON with score, strengths, weaknesses

See: [`lib/gemini.js`](./src/lib/gemini.js)

## 🧪 Testing

### Test Autodesk Token

```bash
curl -X POST https://developer.api.autodesk.com/authentication/v2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${AUTODESK_CLIENT_ID}&client_secret=${AUTODESK_CLIENT_SECRET}&grant_type=client_credentials&scope=data:read%20data:write"
```

### Test Gemini API

```bash
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: ${GEMINI_API_KEY}" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Local Testing with Mock Server

```bash
npm run mock:dev
```

Runs mock server on port 4000 without Autodesk/Gemini credentials.

## 📊 Data Flow

```
Frontend
  ↓
[POST /evaluate] → Gemini Vision API → Evaluation Result
                    ↓ (Images)
                 Google Cloud Storage (signed URLs)

Frontend
  ↓
[POST /convert] → Autodesk OSS (Upload) → Model Derivative Job
[GET /convert/:jobId] → Poll Status
[GET /convert/:jobId/:format] → Download IFC/PDF
```

## 🛠️ Architecture

- **Express.js**: REST API server
- **Multer**: File upload handling (up to 100MB)
- **@google/generative-ai**: Gemini Vision API client
- **Autodesk SDK**: (via HTTP) Model Derivative & OSS
- **dotenv**: Environment variable management

## 📚 File Structure

```
server/
├── src/
│   ├── index.js          # Main Express app (production)
│   ├── mock-server.js    # Mock server (for testing)
│   └── lib/
│       ├── autodesk.js   # Autodesk API integration
│       └── gemini.js     # Gemini Vision integration
├── .env                  # Configuration (gitignored)
├── package.json
└── README.md
```

## 🔐 Security Notes

1. **API Keys**: Never commit `.env` file to Git
2. **CORS**: Configure allowed origins in production
3. **File Size**: 100MB limit per file (configurable in `index.js`)
4. **Autodesk Token**: Cached with 5-minute expiry buffer
5. **Gemini Rate Limits**: Check API quotas in Google Cloud Console

## 🐛 Troubleshooting

### `EADDRINUSE` on port 4000
```bash
# Find and kill process
lsof -i :4000
kill -9 <PID>
```

### Autodesk Token Error
- Verify `AUTODESK_CLIENT_ID` and `AUTODESK_CLIENT_SECRET` in `.env`
- Ensure app has `data:read`, `data:write` scopes

### Gemini API Error
- Check `GEMINI_API_KEY` is valid
- Verify API quota in Google Cloud Console
- Ensure Gemini 2.0 Flash Exp model is available in your region

## 📖 References

- [Autodesk APS Documentation](https://aps.autodesk.com)
- [Model Derivative API](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/)
- [Google Gemini API](https://ai.google.dev)
- [Express.js Guide](https://expressjs.com)

