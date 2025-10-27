'use strict';

/**
 * Centralized Error Handling & Logging System
 * Provides consistent error responses, logging, and monitoring
 */

const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // File Errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // API Errors
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_TIMEOUT: 'API_TIMEOUT',
  API_ERROR: 'API_ERROR',

  // Validation Errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Job/Process Errors
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  JOB_FAILED: 'JOB_FAILED',
  JOB_TIMEOUT: 'JOB_TIMEOUT',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REQUEST_TIMEOUT: 408,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Custom Application Error
 */
class AppError extends Error {
  constructor(message, code, statusCode, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Logger with structured output
 */
class Logger {
  static INFO = 'INFO';
  static WARN = 'WARN';
  static ERROR = 'ERROR';
  static DEBUG = 'DEBUG';

  static _formatLog(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${category}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static info(category, message, data) {
    this._formatLog(this.INFO, category, message, data);
  }

  static warn(category, message, data) {
    console.warn(`${new Date().toISOString()} [${this.WARN}] [${category}] ${message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  }

  static error(category, message, error, data) {
    console.error(`${new Date().toISOString()} [${this.ERROR}] [${category}] ${message}`);
    if (error) {
      console.error(`  Error: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    }
    if (data) console.error(JSON.stringify(data, null, 2));
  }

  static debug(category, message, data) {
    if (process.env.DEBUG === 'true') {
      this._formatLog(this.DEBUG, category, message, data);
    }
  }
}

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  Logger.error('ERROR_HANDLER', `${req.method} ${req.path}`, err, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        timestamp: err.timestamp,
        requestId: req.id
      }
    });
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    let statusCode = HTTP_STATUS.BAD_REQUEST;
    let message = err.message;

    if (err.code === 'FILE_TOO_LARGE') {
      statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
      message = 'File size exceeds maximum allowed (100MB)';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum is 3 files';
    } else if (err.code === 'LIMIT_FIELD_COUNT') {
      message = 'Too many form fields';
    }

    return res.status(statusCode).json({
      ok: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message,
        details: { multerCode: err.code },
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle Axios errors
  if (err.response) {
    const statusCode = err.response.status || HTTP_STATUS.BAD_GATEWAY;
    const code = statusCode === 429 ? 'API_RATE_LIMIT' : 'API_ERROR';

    return res.status(statusCode).json({
      ok: false,
      error: {
        code,
        message: `External API error: ${err.response.statusText || err.message}`,
        statusCode,
        details: {
          apiStatus: err.response.status,
          apiMessage: err.response.data?.message || err.response.data?.error
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle timeout errors
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(HTTP_STATUS.GATEWAY_TIMEOUT).json({
      ok: false,
      error: {
        code: 'API_TIMEOUT',
        message: 'Request timeout - operation took too long',
        statusCode: HTTP_STATUS.GATEWAY_TIMEOUT,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'An internal server error occurred',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : {},
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Validation helper
 */
const validateRequest = (fields, data) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      'MISSING_FIELD',
      HTTP_STATUS.BAD_REQUEST,
      { missingFields: missing }
    );
  }
};

/**
 * Async wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Request ID middleware
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = req.get('x-request-id') || 
           req.get('x-correlation-id') || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.set('X-Request-ID', req.id);
  
  Logger.debug('REQUEST', `${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip
  });

  next();
};

/**
 * Performance monitoring middleware
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = duration > 5000 ? 'WARN' : 'INFO';

    if (level === 'WARN') {
      Logger.warn('PERFORMANCE', `Slow request: ${req.method} ${req.path} took ${duration}ms`);
    } else {
      Logger.debug('PERFORMANCE', `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};

/**
 * Common error factory functions
 */
const Errors = {
  BadRequest: (message, details) => 
    new AppError(message, 'INVALID_REQUEST', HTTP_STATUS.BAD_REQUEST, details),

  FileNotFound: (message, details) =>
    new AppError(message, 'FILE_NOT_FOUND', HTTP_STATUS.NOT_FOUND, details),

  FileTooLarge: (message, details) =>
    new AppError(message, 'FILE_TOO_LARGE', HTTP_STATUS.PAYLOAD_TOO_LARGE, details),

  InvalidFormat: (message, details) =>
    new AppError(message, 'INVALID_FILE_FORMAT', HTTP_STATUS.BAD_REQUEST, details),

  JobNotFound: (message, details) =>
    new AppError(message, 'JOB_NOT_FOUND', HTTP_STATUS.NOT_FOUND, details),

  JobFailed: (message, details) =>
    new AppError(message, 'JOB_FAILED', HTTP_STATUS.INTERNAL_SERVER_ERROR, details),

  ApiError: (message, statusCode, details) =>
    new AppError(message, 'API_ERROR', statusCode || HTTP_STATUS.BAD_GATEWAY, details),

  ServiceUnavailable: (message, details) =>
    new AppError(message, 'SERVICE_UNAVAILABLE', HTTP_STATUS.SERVICE_UNAVAILABLE, details),

  Unauthorized: (message, details) =>
    new AppError(message, 'UNAUTHORIZED', HTTP_STATUS.UNAUTHORIZED, details),

  Timeout: (message, details) =>
    new AppError(message, 'REQUEST_TIMEOUT', HTTP_STATUS.REQUEST_TIMEOUT, details)
};

module.exports = {
  AppError,
  Logger,
  ERROR_CODES,
  HTTP_STATUS,
  errorHandler,
  validateRequest,
  asyncHandler,
  requestIdMiddleware,
  performanceMiddleware,
  Errors
};
