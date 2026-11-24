function errorHandler(err, req, res, next) {
  const correlationId = req.id || req.headers['x-request-id'] || 'no-id';

  // Log internal details securely on the server console for authorized investigation
  console.error(`[API Error ${correlationId}]:`, {
    timestamp: new Date().toISOString(),
    message: err.message,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  // Sanitize message: never leak database syntax or driver errors to client
  let clientMessage = err.message || 'An unexpected internal error occurred.';
  let errorCode = err.code || 'INTERNAL_ERROR';

  if (err.sql || err.sqlMessage || (err.code && String(err.code).startsWith('ER_'))) {
    clientMessage = 'A database operation could not be completed. The incident has been recorded.';
    errorCode = 'DATABASE_ERROR';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    clientMessage = 'Authentication token is invalid or expired. Please sign in again.';
    errorCode = 'AUTHENTICATION_REQUIRED';
  } else if (err.code === 'ECONNREFUSED') {
    clientMessage = 'An internal upstream dependency is temporarily unreachable.';
    errorCode = 'SERVICE_UNREACHABLE';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    error: {
      code: errorCode,
      message: clientMessage,
      requestId: correlationId
    }
  });
}

module.exports = errorHandler;
