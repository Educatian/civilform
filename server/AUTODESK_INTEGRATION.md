# Autodesk Model Derivative API Integration

Convert Revit RVT files to IFC and PDF formats using Autodesk's Model Derivative API.

## Overview

This integration uses:
- **Autodesk Forge Authentication** - OAuth 2.0
- **Object Storage Service (OSS)** - Upload files
- **Model Derivative API** - Submit conversion jobs
- **Webhook (Optional)** - Monitor job completion

## Setup

### 1. Get Autodesk Credentials

Visit: https://forge.autodesk.com/en/docs/oauth/v2/tutorials/create-app/

1. Sign in to Autodesk Forge
2. Create a new **3-legged OAuth App**
3. Copy: **Client ID** and **Client Secret**
4. Set Callback URL: `http://localhost:3000/callback` (for local development)

### 2. Create OSS Bucket

```bash
# Create bucket via Postman or curl
POST https://developer.api.autodesk.com/oss/v2/buckets

Authorization: Bearer {access_token}
Content-Type: application/json

{
  "bucketKey": "civilfo-bucket-{timestamp}",
  "policyKey": "temporary"
}
```

### 3. Configure Environment

Update `server/.env`:

```env
AUTODESK_CLIENT_ID=your_client_id
AUTODESK_CLIENT_SECRET=your_client_secret
AUTODESK_OSS_BUCKET_KEY=civilfo-bucket-xxx
```

## API Usage

### Upload & Convert RVT to IFC/PDF

```bash
# POST /convert
curl -X POST http://localhost:4000/convert \
  -F "images=@project.rvt" \
  -F "studentId=20201234" \
  -F "courseCode=CE301"
```

**Response:**
```json
{
  "ok": true,
  "jobs": [
    {
      "jobId": "job_20201234_1729999999_0",
      "fileName": "project.rvt",
      "urn": "dXJuOmFkc2sud2lwcHI6ZnM...",
      "status": "submitted"
    }
  ]
}
```

### Check Conversion Status

```bash
# GET /convert/:jobId
curl http://localhost:4000/convert/job_20201234_1729999999_0
```

**Response:**
```json
{
  "jobId": "job_20201234_1729999999_0",
  "status": "processing",
  "progress": 60,
  "message": "Conversion processing (60%)",
  "formats": null  // Will be populated when status = "completed"
}
```

**Status Values:**
- `submitted` - Job accepted (0-10%)
- `processing` - Converting (40-70%)
- `completed` - Ready for download (100%)

### Download Converted File

```bash
# GET /convert/:jobId/ifc
curl http://localhost:4000/convert/job_20201234_1729999999_0/ifc \
  -o project.ifc

# GET /convert/:jobId/pdf
curl http://localhost:4000/convert/job_20201234_1729999999_0/pdf \
  -o project.pdf
```

## Production Implementation

### Using Real Autodesk APIs

Replace mock implementation in `mock-server.js` with real API calls from `src/lib/autodesk.js`:

```javascript
const {
  getAccessToken,
  uploadToOSS,
  submitDerivativeJob,
  checkJobStatus,
  getDerivativeUrl
} = require('./lib/autodesk');

// Upload file
const { bucketKey, objectKey } = await uploadToOSS(
  bucketKey,
  'project.rvt',
  fileBuffer
);

// Submit conversion job
const job = await submitDerivativeJob(bucketKey, objectKey, ['ifc', 'pdf']);

// Poll for completion
const manifest = await checkJobStatus(job.urn);

// Get download URL
const downloadUrl = await getDerivativeUrl(job.urn, 'ifc');
```

### Webhook for Job Completion

Set up webhook to be notified when conversion completes:

```bash
POST https://developer.api.autodesk.com/webhooks/v1/systems/derivative/events

{
  "callbackUrl": "https://yourapp.com/webhooks/derivative",
  "scope": {
    "workflow": "derivative.conversion_finished"
  }
}
```

## Supported Formats

### Input
- `.rvt` - Revit Project
- `.rfa` - Revit Family
- `.adt` - Archive

### Output
- **IFC** (Industry Foundation Classes) - Open BIM standard
- **PDF** - 2D/3D views
- **STEP** - CAD exchange format
- **IGES** - Engineering drawing format

## Conversion Times

Typical conversion times:
- Small project (<50 MB): 30-60 seconds
- Medium project (50-200 MB): 1-3 minutes
- Large project (>200 MB): 3-10 minutes

## Error Handling

```javascript
try {
  const result = await submitDerivativeJob(bucketKey, objectKey);
} catch (err) {
  if (err.message.includes('Invalid credentials')) {
    // Re-authenticate
  } else if (err.message.includes('Unsupported format')) {
    // Validate input file format
  } else {
    // Handle other errors
  }
}
```

## Quota & Pricing

- Free tier: 50 API calls/day
- Standard: Pay-per-conversion after quota
- Enterprise: Volume discounts

View pricing: https://forge.autodesk.com/en/pricing

## Debugging

### Check API Health

```bash
curl https://developer.api.autodesk.com/authentication/v2/token \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_ID&client_secret=YOUR_SECRET&grant_type=client_credentials&scope=data:read"
```

### View Conversion Logs

In `mock-server.js` logs:
```
[DERIVATIVE] /convert request received
[DERIVATIVE] Files to convert: 1
[DERIVATIVE] ✅ 1 conversion jobs created
[DERIVATIVE] ✅ Status check: processing (60%)
```

## References

- [Autodesk Forge Docs](https://developer.autodesk.com/en/docs/forge/v1/overview/)
- [Model Derivative API](https://developer.autodesk.com/en/docs/model-derivative/v2/overview/)
- [Authentication OAuth2](https://developer.autodesk.com/en/docs/oauth/v2/overview/)
- [Revit to IFC Export](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/CloudHelp/cloudhelp_9C52B4A8-0DE1-4D6F-87EB-3D084D66E1A9.html)

## Testing

Use `npm run mock:dev` to test locally without Autodesk credentials:

```bash
curl -X POST http://localhost:4000/convert \
  -F "images=@test.rvt" \
  -F "studentId=test"
```

**Mock server simulates:**
- File upload (instant)
- Conversion job creation (2-5 sec progress)
- File download (mock IFC/PDF)
