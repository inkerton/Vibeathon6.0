import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import passport from '../config/passport';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyOTP.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/resend-otp', authController.resendOTP.bind(authController));

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`
  }),
  authController.googleAuthCallback.bind(authController)
);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

module.exports = router;