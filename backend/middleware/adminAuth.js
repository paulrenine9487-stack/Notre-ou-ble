const { logSecurityEvent } = require('../utils/securityLogger');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication required.'
    });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
    logSecurityEvent(req, {
      action: 'SECURITY_ALERT_UNAUTHORIZED_ADMIN_ACCESS',
      status: 'BLOCKED',
      userId: req.user.id,
      username: req.user.username,
      details: { attemptedPath: req.originalUrl, requiredRole: 'ADMIN' }
    });

    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrative privileges required to access this resource.'
    });
  }

  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication required.'
    });
  }

  if (req.user.role !== 'SUPERADMIN') {
    logSecurityEvent(req, {
      action: 'SECURITY_ALERT_UNAUTHORIZED_SUPERADMIN_ACCESS',
      status: 'BLOCKED',
      userId: req.user.id,
      username: req.user.username,
      details: { attemptedPath: req.originalUrl, requiredRole: 'SUPERADMIN' }
    });

    return res.status(403).json({
      success: false,
      message: 'Forbidden. Superadmin privileges required for this action.'
    });
  }

  next();
}

module.exports = {
  requireAdmin,
  requireSuperAdmin
};
