const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { logSecurityEvent } = require('../utils/securityLogger');
const cacheService = require('../services/cacheService');

// Helper to log audit actions
async function logAudit(adminId, action, targetType = null, targetId = null, details = null) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, typeof details === 'object' ? JSON.stringify(details) : details]
    );

    // Also record in central security_audit_logs table
    await pool.query(
      `INSERT INTO security_audit_logs (user_id, action, status, details)
       VALUES (?, ?, 'SUCCESS', ?)`,
      [adminId, action, typeof details === 'object' ? JSON.stringify(details) : JSON.stringify({ targetType, targetId, details })]
    );
  } catch (err) {
    console.error('[Admin Audit Log Error]:', err.message);
  }
}

// GET /api/admin/overview - Platform-wide KPI metrics with user analytics
exports.getOverview = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPERADMIN';
    const [userCount] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'USER'");
    const [adminCount] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role IN ('ADMIN', 'SUPERADMIN')");
    
    // Login and visitor analytics (exclude superadmin logins if current user is not superadmin)
    let loginCountQuery = "SELECT COUNT(*) AS total FROM security_audit_logs sal LEFT JOIN users u ON sal.user_id = u.id WHERE sal.action IN ('LOGIN_SUCCESS', 'LOGIN_SUCCESS_WITH_MFA')";
    let uniqueLoginsQuery = "SELECT COUNT(DISTINCT sal.user_id) AS total FROM security_audit_logs sal LEFT JOIN users u ON sal.user_id = u.id WHERE sal.action IN ('LOGIN_SUCCESS', 'LOGIN_SUCCESS_WITH_MFA') AND sal.user_id IS NOT NULL";
    
    if (!isSuperAdmin) {
      const superAdminExclusion = " AND (u.role IS NULL OR u.role != 'SUPERADMIN') AND LOWER(COALESCE(sal.username, '')) != 'notreoblemccmrfip' AND LOWER(COALESCE(sal.username, '')) NOT LIKE '%superadmin%'";
      loginCountQuery += superAdminExclusion;
      uniqueLoginsQuery += superAdminExclusion;
    }

    const [loginCount] = await pool.query(loginCountQuery);
    const [uniqueLogins] = await pool.query(uniqueLoginsQuery);
    const [totalEvents] = await pool.query("SELECT COUNT(*) AS total FROM security_audit_logs");
    
    const [practiceStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_sessions,
        COALESCE(SUM(duration_minutes), 0) AS total_minutes,
        COUNT(DISTINCT user_id) AS active_practitioners
      FROM practice_sessions 
      WHERE completion_status = 'completed'
    `);
    const [learningStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_completed_activities,
        COUNT(DISTINCT user_id) AS active_learners
      FROM user_learning_progress
      WHERE completion_status = 'completed'
    `);
    const [moduleCount] = await pool.query('SELECT COUNT(*) AS total FROM learning_modules');
    const [activityCount] = await pool.query('SELECT COUNT(*) AS total FROM learning_activities');

    // Recent registered users
    const [recentUsers] = await pool.query(`
      SELECT id, username, email, selected_musical_goal, created_at 
      FROM users 
      WHERE role = 'USER' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // Recent login events - if not superadmin, exclude superadmin logins completely
    let recentLoginsQuery = `
      SELECT sal.id, sal.user_id, sal.username, sal.action, sal.ip_address, sal.created_at, u.role AS user_role
      FROM security_audit_logs sal
      LEFT JOIN users u ON sal.user_id = u.id
      WHERE sal.action IN ('LOGIN_SUCCESS', 'LOGIN_SUCCESS_WITH_MFA')
    `;
    if (!isSuperAdmin) {
      recentLoginsQuery += ` AND (u.role IS NULL OR u.role != 'SUPERADMIN') 
                             AND LOWER(COALESCE(sal.username, '')) != 'notreoblemccmrfip' 
                             AND LOWER(COALESCE(sal.username, '')) NOT LIKE '%superadmin%'`;
    }
    recentLoginsQuery += ` ORDER BY sal.created_at DESC LIMIT 5`;

    const [recentLogins] = await pool.query(recentLoginsQuery);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: userCount[0].total,
        totalAdmins: adminCount[0].total,
        totalLogins: loginCount[0].total,
        uniqueLoginUsers: uniqueLogins[0].total,
        totalPortalVisits: totalEvents[0].total,
        totalPracticeMinutes: practiceStats[0].total_minutes,
        totalPracticeSessions: practiceStats[0].total_sessions,
        activePractitioners: practiceStats[0].active_practitioners,
        totalCompletedActivities: learningStats[0].total_completed_activities,
        activeLearners: learningStats[0].active_learners,
        totalModules: moduleCount[0].total,
        totalActivities: activityCount[0].total,
        recentUsers,
        recentLogins
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users - List users with their practice & learning statistics
exports.getUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.gender,
        u.phone,
        u.role,
        u.vocal_trainer_name,
        u.selected_musical_goal,
        u.created_at,
        COALESCE(SUM(ps.duration_minutes), 0) AS total_practice_minutes,
        COUNT(DISTINCT ps.id) AS total_sessions,
        COUNT(DISTINCT ulp.id) AS completed_activities
      FROM users u
      LEFT JOIN practice_sessions ps ON u.id = ps.user_id AND ps.completion_status = 'completed'
      LEFT JOIN user_learning_progress ulp ON u.id = ulp.user_id AND ulp.completion_status = 'completed'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users - Superadmin creates an ADMIN account
exports.createAdminUser = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required.'
      });
    }

    // Only ADMIN accounts can be provisioned. Notreoblemccmrfip is the sole Superadmin.
    const assignedRole = 'ADMIN';

    // Check existing email
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (username, gender, email, phone, password_hash, role)
       VALUES (?, 'Other', ?, ?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), phone ? phone.trim() : '+910000000000', passwordHash, assignedRole]
    );

    await logAudit(req.user.id, `Created ${assignedRole} account`, 'users', result.insertId, { email, role: assignedRole });

    res.status(201).json({
      success: true,
      message: `Admin account created successfully.`,
      user: {
        id: result.insertId,
        username,
        email,
        role: assignedRole
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id/role - Superadmin promotes or updates user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified. Only USER or ADMIN roles can be assigned.' });
    }

    // Prevent changing the sole superadmin (Notreoblemccmrfip) or any target user who is SUPERADMIN
    const [targetRows] = await pool.query('SELECT role, username FROM users WHERE id = ?', [targetUserId]);
    if (targetRows.length > 0 && targetRows[0].role === 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot demote or modify the primary system Superadmin.'
      });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId]);

    await logAudit(req.user.id, 'Updated user role', 'users', targetUserId, { newRole: role });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/practice-reports - Detailed practice reports
exports.getPracticeReports = async (req, res, next) => {
  try {
    const [reports] = await pool.query(`
      SELECT 
        ps.id,
        ps.user_id,
        u.username,
        u.email,
        ps.session_type,
        ps.exercise_name,
        ps.duration_minutes,
        ps.completion_status,
        ps.notes,
        ps.completed_at
      FROM practice_sessions ps
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.completed_at DESC
      LIMIT 100
    `);

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/audit-logs - Superadmin audit logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const [logs] = await pool.query(`
      SELECT 
        al.id,
        al.admin_id,
        u.username AS admin_username,
        al.action,
        al.target_type,
        al.target_id,
        al.details,
        al.created_at
      FROM admin_audit_logs al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/security-logs - Enterprise Zero Trust Security Audit Logs
exports.getSecurityAuditLogs = async (req, res, next) => {
  try {
    const [logs] = await pool.query(`
      SELECT 
        id,
        user_id,
        username,
        action,
        status,
        ip_address,
        user_agent,
        details,
        created_at
      FROM security_audit_logs
      ORDER BY created_at DESC
      LIMIT 200
    `);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// Learning Modules Management (Admin / Superadmin)
exports.getModules = async (req, res, next) => {
  try {
    const [modules] = await pool.query('SELECT * FROM learning_modules ORDER BY display_order ASC, module_number ASC');
    res.status(200).json({ success: true, modules });
  } catch (error) {
    next(error);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id, 10);
    const { title, description, status, is_available } = req.body;
    await pool.query(
      `UPDATE learning_modules 
       SET title = COALESCE(?, title), 
           description = COALESCE(?, description), 
           status = COALESCE(?, status), 
           is_available = COALESCE(?, is_available), 
           updated_at = NOW() 
       WHERE id = ?`,
      [title ? title.trim() : null, description ? description.trim() : null, status || null, is_available !== undefined ? (is_available ? 1 : 0) : null, moduleId]
    );
    await logAudit(req.user.id, 'Updated learning module', 'learning_modules', moduleId, { title, status, is_available });
    const [updated] = await pool.query('SELECT * FROM learning_modules WHERE id = ?', [moduleId]);
    res.status(200).json({ success: true, message: 'Module updated successfully.', module: updated[0] });
  } catch (error) {
    next(error);
  }
};

exports.createModule = async (req, res, next) => {
  try {
    const { title, description, module_order, status } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }

    const [resInsert] = await pool.query(
      'INSERT INTO learning_modules (title, description, module_order, status) VALUES (?, ?, ?, ?)',
      [title.trim(), description.trim(), module_order || 1, status || 'COMING_SOON']
    );

    await logAudit(req.user.id, 'Created learning module', 'learning_modules', resInsert.insertId, { title });

    res.status(201).json({
      success: true,
      message: 'Learning module created successfully.',
      id: resInsert.insertId
    });
  } catch (error) {
    next(error);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const { module_id, title, description, activity_order } = req.body;
    if (!module_id || !title || !description) {
      return res.status(400).json({ success: false, message: 'Module ID, title and description required' });
    }

    const [resInsert] = await pool.query(
      'INSERT INTO learning_activities (module_id, title, description, activity_order) VALUES (?, ?, ?, ?)',
      [module_id, title.trim(), description.trim(), activity_order || 1]
    );

    await logAudit(req.user.id, 'Created learning activity', 'learning_activities', resInsert.insertId, { title, module_id });

    res.status(201).json({
      success: true,
      message: 'Learning activity created successfully.',
      id: resInsert.insertId
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/theme or /api/admin/public-theme - Get current branding theme
exports.getBrandingTheme = async (req, res, next) => {
  try {
    const theme = await cacheService.wrap('theme:branding', async () => {
      const [rows] = await pool.query('SELECT * FROM branding_settings WHERE id = 1');
      return rows.length > 0 ? rows[0] : {
        theme_name: 'Default Vocal Teal',
        primary_color: '#193B40',
        secondary_color: '#398575',
        accent_bg_color: '#DCECE5',
        main_bg_color: '#F3F6F3'
      };
    }, 3600, ['theme']);

    res.status(200).json({
      success: true,
      theme
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/theme - Update branding theme colors
exports.updateBrandingTheme = async (req, res, next) => {
  try {
    const {
      theme_name,
      primary_color,
      secondary_color,
      accent_bg_color,
      main_bg_color
    } = req.body;

    if (!primary_color || !secondary_color) {
      return res.status(400).json({
        success: false,
        message: 'Primary and secondary colors are required.'
      });
    }

    const tName = theme_name || 'Custom Admin Palette';
    const pColor = primary_color.trim();
    const sColor = secondary_color.trim();
    const aColor = (accent_bg_color || '#DCECE5').trim();
    const mColor = (main_bg_color || '#F3F6F3').trim();
    const adminId = req.user ? req.user.id : null;

    await pool.query(`
      INSERT INTO branding_settings (id, theme_name, primary_color, secondary_color, accent_bg_color, main_bg_color, updated_by)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        theme_name = VALUES(theme_name),
        primary_color = VALUES(primary_color),
        secondary_color = VALUES(secondary_color),
        accent_bg_color = VALUES(accent_bg_color),
        main_bg_color = VALUES(main_bg_color),
        updated_by = VALUES(updated_by)
    `, [tName, pColor, sColor, aColor, mColor, adminId]);

    // Invalidate theme cache immediately
    await cacheService.invalidateTag('theme');

    if (adminId) {
      await logAudit(adminId, 'Updated branding theme colors', 'branding_settings', 1, {
        theme_name: tName,
        primary_color: pColor,
        secondary_color: sColor
      });
    }

    const [rows] = await pool.query('SELECT * FROM branding_settings WHERE id = 1');

    res.status(200).json({
      success: true,
      message: 'Branding theme updated and applied successfully.',
      theme: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
