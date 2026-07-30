import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import passport from '../config/passport';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authHandler(authController.register.bind(authController)));
router.post('/verify-otp', authHandler(authController.verifyOTP.bind(authController)));
router.post('/login', authHandler(authController.login.bind(authController)));
router.post('/resend-otp', authHandler(authController.resendOTP.bind(authController)));

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
  authHandler(authController.googleAuthCallback.bind(authController))
);

// Protected routes
router.get('/me', authMiddleware, authHandler(authController.getCurrentUser.bind(authController)));
router.post('/logout', authMiddleware, authHandler(authController.logout.bind(authController)));
router.post('/refresh', authHandler(authController.refreshToken.bind(authController)));

export default router;