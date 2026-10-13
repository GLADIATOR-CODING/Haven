import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  // If it's a known ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    });
  }

  // If it's a Zod validation error
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      fields[path] = issue.message;
    }

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        fields,
      },
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
  }

  // Unknown / Internal error
  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred',
    },
  });
}
