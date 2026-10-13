export class ApiError extends Error {
  constructor(statusCode, code, message, fields = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Error.captureStackTrace(this, this.constructor);
  }
}
