'use strict';

const axios = require('axios');

const AUTODESK_BASE_URL = 'https://developer.api.autodesk.com';
const DERIVATIVE_API_URL = `${AUTODESK_BASE_URL}/modelderivative/v2`;
const OSS_API_URL = `${AUTODESK_BASE_URL}/oss/v2`;

let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Get Autodesk OAuth2 access token
 * Reference: https://aps.autodesk.com/en/docs/oauth/v2/reference/http/
 */
async function getAccessToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 300000) {
    return cachedAccessToken;
  }

  const clientId = process.env.AUTODESK_CLIENT_ID;
  const clientSecret = process.env.AUTODESK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing AUTODESK_CLIENT_ID or AUTODESK_CLIENT_SECRET environment variables');
  }

  try {
    const response = await axios.post(`${AUTODESK_BASE_URL}/authentication/v2/token`, 
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'data:read data:write bucket:create bucket:read bucket:delete code:all'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    cachedAccessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

    return cachedAccessToken;
  } catch (err) {
    throw new Error(`Failed to get Autodesk token: ${err.message}`);
  }
}

/**
 * Create OSS bucket
 * Reference: https://aps.autodesk.com/en/docs/object-storage/v1/reference/http/buckets/post-buckets/
 */
async function createOSSBucket(bucketKey, policyKey = 'temporary') {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${OSS_API_URL}/buckets`,
      {
        bucketKey,
        policyKey // 'transient', 'temporary', or 'persistent'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`Bucket ${bucketKey} already exists`);
      return { bucketKey };
    }
    throw new Error(`Failed to create OSS bucket: ${err.message}`);
  }
}

/**
 * Upload file to OSS bucket
 * Reference: https://aps.autodesk.com/en/docs/object-storage/v1/reference/http/buckets-objectkey-details/put-buckets-objectkey-details/
 */
async function uploadToOSS(bucketKey, fileName, fileBuffer) {
  const token = await getAccessToken();
  const objectKey = `${fileName}-${Date.now()}`;

  try {
    const response = await axios.put(
      `${OSS_API_URL}/buckets/${bucketKey}/objects/${objectKey}`,
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream'
        }
      }
    );

    return { bucketKey, objectKey, urn: Buffer.from(`${bucketKey}/${objectKey}`).toString('base64') };
  } catch (err) {
    throw new Error(`OSS upload failed: ${err.message}`);
  }
}

/**
 * Submit Model Derivative conversion job
 * Reference: https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/job/post-job/
 * 
 * Supported output formats:
 * - ifc (Industry Foundation Classes)
 * - pdf (2D/3D views)
 * - step (STEP format)
 * - iges (IGES format)
 * - svf (Simplified Viewer Format - for 3D viewing)
 */
async function submitDerivativeJob(urn, outputFormats = ['ifc', 'pdf']) {
  const token = await getAccessToken();

  // Build output formats with IFC-specific settings
  const outputs = outputFormats.map(format => {
    if (format === 'ifc') {
      return {
        type: 'ifc',
        advanced: {
          exportSettingName: 'IFC2x3 Coordination View 2.0' // Default IFC export setting
        }
      };
    } else if (format === 'pdf') {
      return {
        type: 'pdf',
        views: ['2d', '3d'] // Generate both 2D and 3D PDF views
      };
    } else {
      return { type: format };
    }
  });

  const jobPayload = {
    input: { urn }, // Base64 encoded bucket/object path
    output: {
      formats: outputs,
      destination: { region: 'us' } // Optional: specify region
    }
  };

  try {
    const response = await axios.post(
      `${DERIVATIVE_API_URL}/designdata/job`,
      jobPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-ads-force': 'true' // Force conversion even if source format is unsupported
        }
      }
    );

    return response.data;
  } catch (err) {
    throw new Error(`Derivative job submission failed: ${err.message}`);
  }
}

/**
 * Check Model Derivative job status
 * Reference: https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/designdata-urn-manifest/get-designdata-urn-manifest/
 */
async function checkJobStatus(urn) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${DERIVATIVE_API_URL}/designdata/${urn}/manifest`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Response structure:
    // {
    //   "status": "success|pending|inprogress|failed",
    //   "progress": "0%-100%",
    //   "derivatives": [
    //     {
    //       "name": "output filename",
    //       "hasThumbnail": true,
    //       "status": "success",
    //       "outputType": "ifc|pdf|..."
    //     }
    //   ]
    // }

    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      return { status: 'pending', progress: '0%' };
    }
    throw new Error(`Failed to check job status: ${err.message}`);
  }
}

/**
 * Get derivative download URL
 * Reference: https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/designdata-urn-manifest-outputType-object-id/get-designdata-urn-manifest-outputType-object-id/
 */
async function getDerivativeUrl(urn, outputFormat) {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${DERIVATIVE_API_URL}/designdata/${urn}/manifest`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.status !== 'success') {
      throw new Error(`Conversion not complete. Status: ${response.data.status}`);
    }

    // Find the derivative for the requested format
    const derivative = response.data.derivatives?.find(d => d.outputType === outputFormat);
    if (!derivative) {
      throw new Error(`No derivative found for format: ${outputFormat}`);
    }

    // Download URLs can be constructed from the manifest
    // or retrieved using the derivative details
    return {
      urn,
      format: outputFormat,
      status: response.data.status,
      derivative,
      downloadUrl: `${DERIVATIVE_API_URL}/designdata/${urn}/manifest/${outputFormat}/${derivative.id}`
    };
  } catch (err) {
    throw new Error(`Failed to get derivative URL: ${err.message}`);
  }
}

/**
 * Delete object from OSS bucket
 * Reference: https://aps.autodesk.com/en/docs/object-storage/v1/reference/http/buckets-objectkey-details/delete-buckets-objectkey-details/
 */
async function deleteFromOSS(bucketKey, objectKey) {
  const token = await getAccessToken();

  try {
    await axios.delete(
      `${OSS_API_URL}/buckets/${bucketKey}/objects/${objectKey}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return true;
  } catch (err) {
    throw new Error(`Failed to delete from OSS: ${err.message}`);
  }
}

module.exports = {
  getAccessToken,
  createOSSBucket,
  uploadToOSS,
  submitDerivativeJob,
  checkJobStatus,
  getDerivativeUrl,
  deleteFromOSS
};
