'use strict';

const axios = require('axios');

const AUTODESK_BASE_URL = 'https://developer.api.autodesk.com';
const DERIVATIVE_API_URL = `${AUTODESK_BASE_URL}/modelderivative/v2`;

let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Get Autodesk OAuth2 access token
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
        scope: 'data:read data:write bucket:create bucket:read'
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
 * Upload file to OSS bucket
 */
async function uploadToOSS(bucketKey, fileName, fileBuffer) {
  const token = await getAccessToken();
  const objectKey = `${fileName}-${Date.now()}`;

  try {
    await axios.put(
      `${AUTODESK_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}`,
      fileBuffer,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream'
        }
      }
    );

    return { bucketKey, objectKey };
  } catch (err) {
    throw new Error(`OSS upload failed: ${err.message}`);
  }
}

/**
 * Submit job to Model Derivative API
 * @param {string} bucketKey - OSS bucket key
 * @param {string} objectKey - OSS object key
 * @param {string[]} outputFormats - Array of formats: 'ifc', 'pdf', 'step', 'iges'
 */
async function submitDerivativeJob(bucketKey, objectKey, outputFormats = ['ifc', 'pdf']) {
  const token = await getAccessToken();

  const outputs = outputFormats.map(format => {
    const formatMap = {
      'ifc': { type: 'ifc' },
      'pdf': { type: 'pdf', views: ['2d', '3d'] },
      'step': { type: 'step' },
      'iges': { type: 'iges' }
    };
    return formatMap[format] || { type: format };
  });

  const jobPayload = {
    input: {
      urn: Buffer.from(`${bucketKey}/${objectKey}`).toString('base64')
    },
    output: {
      formats: outputs
    }
  };

  try {
    const response = await axios.post(
      `${DERIVATIVE_API_URL}/designdata/job`,
      jobPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (err) {
    throw new Error(`Derivative job submission failed: ${err.message}`);
  }
}

/**
 * Check derivative job status
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

    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      return { status: 'pending' };
    }
    throw new Error(`Failed to check job status: ${err.message}`);
  }
}

/**
 * Get derivative download URL
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

    // Find the derivative for the requested format
    const derivative = response.data.derivatives?.find(d => d.outputType === outputFormat);
    if (!derivative) {
      throw new Error(`No derivative found for format: ${outputFormat}`);
    }

    return {
      urn,
      format: outputFormat,
      status: response.data.status,
      derivative
    };
  } catch (err) {
    throw new Error(`Failed to get derivative URL: ${err.message}`);
  }
}

module.exports = {
  getAccessToken,
  uploadToOSS,
  submitDerivativeJob,
  checkJobStatus,
  getDerivativeUrl
};
