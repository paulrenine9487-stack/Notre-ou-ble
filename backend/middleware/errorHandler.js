function errorHandler(err, req, res, next) {
  // Log internal details securely on the server console for authorized investigation
  console.error('[No Tre(ou)ble Server Exception]:', {
    timestamp: new Date().toISOString(),
    message: err.message,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack
  });

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  // Sanitize message: never leak database syntax or driver errors to client
  let clientMessage = err.message || 'An unexpected internal error occurred.';
  if (err.sql || err.sqlMessage || (err.code && String(err.code).startsWith('ER_'))) {
    clientMessage = 'A database operation could not be completed. The incident has been recorded.';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage
  });
}

module.exports = errorHandler;
