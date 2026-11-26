'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('../src/lib/error-handler');

test('oversized multipart files return HTTP 413 with the configured limit message', () => {
  let status, body;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; } };
  const error = Object.assign(new Error('File too large'), { name: 'MulterError', code: 'LIMIT_FILE_SIZE' });
  errorHandler(error, { id: 'fixture', get: () => undefined }, res, () => {});
  assert.equal(status, 413);
  assert.equal(body.error.code, 'FILE_UPLOAD_ERROR');
  assert.equal(body.error.details.multerCode, 'LIMIT_FILE_SIZE');
  assert.equal(body.error.message, 'File size exceeds the configured maximum allowed');
});

test('other upload errors remain bad requests', () => {
  let status;
  const res = { status(value) { status = value; return this; }, json() {} };
  const error = Object.assign(new Error('Too many files'), { name: 'MulterError', code: 'LIMIT_FILE_COUNT' });
  errorHandler(error, { id: 'fixture', get: () => undefined }, res, () => {});
  assert.equal(status, 400);
});
