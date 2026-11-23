const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { authLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-mfa', authLimiter, authController.verifyMfa);
router.post('/refresh', authLimiter, authController.refreshToken);
router.get('/mfa-setup', authenticateToken, authController.getMfaSetup);
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, authController.resendOtp);
router.post('/reset-password', otpLimiter, authController.resetPassword);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
