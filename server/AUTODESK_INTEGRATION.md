# Autodesk Model Derivative API Integration

Convert Revit RVT files to IFC and PDF formats using Autodesk's Model Derivative API.

## Overview

This integration uses [Autodesk Platform Services (APS)](https://aps.autodesk.com):
- **Autodesk Authentication** - OAuth 2.0
- **Object Storage Service (OSS)** - Upload files
- **Model Derivative API** - Submit conversion jobs

## Setup

### 1. Create Autodesk Developer Account

Visit: https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/

1. Go to [Autodesk Developer Portal](https://forge.autodesk.com)
2. Create a **3-legged OAuth App** (for user authentication) OR **2-legged OAuth App** (for service accounts)
3. Copy: **Client ID** and **Client Secret**
4. Set Callback URL: `http://localhost:3000/callback` (for local development)

### 2. Configure Environment

Update `server/.env`:

```env
AUTODESK_CLIENT_ID=your_client_id
AUTODESK_CLIENT_SECRET=your_client_secret
AUTODESK_OSS_BUCKET_KEY=civilfo-bucket-unique-name
```

**Bucket Key Requirements:**
- Must be globally unique across all Autodesk users
- 3-128 characters
- Lowercase letters, numbers, hyphens only
- Format: `civilfo-bucket-{timestamp}` or `civilfo-bucket-{org-code}`

## API Usage

### 1. Upload RVT to Cloud Storage

```bash
# Using the backend endpoint
curl -X POST http://localhost:4000/convert \
  -F "images=@project.rvt" \
  -F "studentId=20201234" \
  -F "courseCode=CE301"
```

This will:
1. Upload to OSS bucket
2. Get URN (Base64 encoded path)
3. Return jobId for status tracking

**Response:**
```json
{
  "ok": true,
  "jobs": [
    {
      "jobId": "job_20201234_..._0",
      "fileName": "project.rvt",
      "urn": "dXJuOmFkc2sub3NzOm9iamVjdC9j...",
      "status": "submitted"
    }
  ]
}
```

### 2. Submit Conversion Job

Reference: [POST /designdata/job](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/job/post-job/)

**IFC Conversion with Settings:**

The API supports these Revit IFC export settings:
- `IFC2x3 Coordination View 2.0` (Default)
- `IFC2x3 Coordination View`
- `IFC2x3 GSA Concept Design BIM 2010`
- `IFC2x3 Basic FM Handover View`
- `IFC2x2 Coordination View`
- `IFC2x2 Singapore BCA e-Plan Check`
- `IFC2x3 Extended FM Handover View`
- `IFC4 Reference View`
- `IFC4 Design Transfer View`

**Example Request:**
```bash
curl -X POST https://developer.api.autodesk.com/modelderivative/v2/designdata/job \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "x-ads-force: true" \
  -d '{
    "input": {
      "urn": "dXJuOmFkc2suY... (Base64 encoded)"
    },
    "output": {
      "formats": [
        {
          "type": "ifc",
          "advanced": {
            "exportSettingName": "IFC4 Reference View"
          }
        },
        {
          "type": "pdf",
          "views": ["2d", "3d"]
        }
      ]
    }
  }'
```

### 3. Check Conversion Status

Reference: [GET /designdata/{urn}/manifest](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/designdata-urn-manifest/get-designdata-urn-manifest/)

```bash
curl http://localhost:4000/convert/job_20201234_1729999999_0
```

**Response:**
```json
{
  "jobId": "job_20201234_1729999999_0",
  "status": "inprogress",
  "progress": 60,
  "message": "Conversion processing (60%)"
}
```

**Status Values:**
- `submitted` - Job accepted (Autodesk queued)
- `inprogress` - Converting (0-100% progress)
- `completed` - Ready for download
- `failed` - Error during conversion

### 4. Download Converted Files

```bash
# IFC format
curl http://localhost:4000/convert/job_20201234_1729999999_0/ifc \
  -o project.ifc

# PDF format (2D/3D views)
curl http://localhost:4000/convert/job_20201234_1729999999_0/pdf \
  -o project.pdf
```

## Supported Formats

### Input
- `.rvt` - Revit Project (Main format)
- `.rfa` - Revit Family
- `.adt` - Archive

### Output
- **IFC** - Industry Foundation Classes (Open BIM standard)
  - Supports IFC2x2, IFC2x3, IFC4
  - Maintains structural and spatial information
  - Essential for BIM coordination
  
- **PDF** - 2D/3D views
  - 2D views from drawing sheets
  - 3D model visualization
  - Print-ready format

- **STEP** - CAD exchange format (ISO 10303)
- **IGES** - Engineering drawing format
- **SVF** - Simplified Viewer Format (3D web viewing)

## Conversion Times & Quotas

### Typical Times
- Small project (<50 MB): 30-60 seconds
- Medium project (50-200 MB): 1-3 minutes
- Large project (>200 MB): 3-10 minutes

### API Quotas (Free Tier)
- 50 API calls/day
- File size: up to 2 GB
- Job retention: 30 days

### Pricing
Free tier includes 50 conversions/day. After that:
- Standard: Pay-per-conversion
- Enterprise: Volume discounts

[View Pricing](https://aps.autodesk.com/en/pricing)

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{ "error": "Invalid access token" }
```
→ Regenerate token, check credentials

**404 Not Found (URN)**
```json
{ "error": "Requested object was not found" }
```
→ Verify URN encoding, ensure file was uploaded successfully

**400 Bad Request**
```json
{ "error": "Unsupported file format" }
```
→ Use `x-ads-force: true` header to force conversion
→ Check file isn't corrupted

**409 Conflict (Bucket)**
```json
{ "error": "Bucket already exists" }
```
→ Bucket key must be globally unique, try different name

## Production Implementation

### Replace Mock with Real API

In `src/index.js`, instead of mock:

```javascript
const {
  getAccessToken,
  createOSSBucket,
  uploadToOSS,
  submitDerivativeJob,
  checkJobStatus,
  getDerivativeUrl,
  deleteFromOSS
} = require('./lib/autodesk');

// 1. Create bucket (first time)
const bucket = await createOSSBucket(bucketKey);

// 2. Upload file
const { urn } = await uploadToOSS(bucketKey, 'project.rvt', fileBuffer);

// 3. Submit conversion
const job = await submitDerivativeJob(urn, ['ifc', 'pdf']);

// 4. Poll for completion
let manifest = await checkJobStatus(urn);
while (manifest.status === 'inprogress') {
  await new Promise(r => setTimeout(r, 5000)); // Wait 5sec
  manifest = await checkJobStatus(urn);
}

// 5. Download
if (manifest.status === 'success') {
  const ifcUrl = await getDerivativeUrl(urn, 'ifc');
}

// 6. Cleanup (optional)
await deleteFromOSS(bucketKey, objectKey);
```

## Webhook for Async Notifications

Instead of polling, set up webhook notifications:

```bash
POST https://developer.api.autodesk.com/webhooks/v1/systems/derivative/events

{
  "callbackUrl": "https://yourapp.com/webhooks/derivative",
  "scope": {
    "workflow": "derivative.conversion_finished"
  }
}
```

Endpoint will receive:
```json
{
  "event": "extraction.finish_success",
  "resourceUrn": "dXJuOmFkc2s...",
  "status": "success",
  "derivatives": [{"outputType": "ifc"}, {"outputType": "pdf"}]
}
```

## References

- [OAuth 2.0](https://aps.autodesk.com/en/docs/oauth/v2/reference/http/)
- [Object Storage Service (OSS)](https://aps.autodesk.com/en/docs/object-storage/v1/reference/http/)
- [Model Derivative API](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/)
- [RVT to IFC Export Guide](https://aps.autodesk.com/blog/export-ifc-rvt-using-model-derivative-api)
- [Revit IFC Export Settings](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/CloudHelp/cloudhelp_9C52B4A8-0DE1-4D6F-87EB-3D084D66E1A9.html)

## Debugging

### API Health Check

```bash
curl -X POST https://developer.api.autodesk.com/authentication/v2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_ID&client_secret=YOUR_SECRET&grant_type=client_credentials&scope=data:read%20data:write"
```

### View Job Status in Real-time

```bash
# Check manifest every second
while true; do
  curl -s https://developer.api.autodesk.com/modelderivative/v2/designdata/{URN}/manifest \
    -H "Authorization: Bearer {TOKEN}" | jq '.status, .progress'
  sleep 1
done
```

### Server Logs

Mock server logs from terminal:
```
[DERIVATIVE] /convert request received
[DERIVATIVE] Files to convert: 1
[DERIVATIVE] ✅ 1 conversion jobs created
[DERIVATIVE] ✅ Status check: processing (60%)
```
