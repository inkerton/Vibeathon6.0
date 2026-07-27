import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

const authService = new AuthService();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('[AUTH_CONTROLLER] register() called');
      console.log('[AUTH_CONTROLLER] Request body:', { 
        name: req.body.name, 
        email: req.body.email, 
        phone: req.body.phone,
        hasPassword: !!req.body.password 
      });
      
      const validatedData = registerSchema.parse(req.body);
      console.log('[AUTH_CONTROLLER] Validation passed');
      console.log('[AUTH_CONTROLLER] Calling authService.register()');
      
      const result = await authService.register(validatedData);
      console.log('[AUTH_CONTROLLER] Registration successful');
      console.log('[AUTH_CONTROLLER] Result:', { message: result.message });
      
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('[AUTH_CONTROLLER] Registration error:', error);
      if (error instanceof z.ZodError) {
        console.error('[AUTH_CONTROLLER] Validation error:', error.errors);
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async verifyOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('[AUTH_CONTROLLER] verifyOTP() called');
      console.log('[AUTH_CONTROLLER] Request body:', { 
        email: req.body.email, 
        otp: req.body.otp 
      });
      
      const validatedData = verifyOTPSchema.parse(req.body);
      console.log('[AUTH_CONTROLLER] Validation passed');
      console.log('[AUTH_CONTROLLER] Calling authService.verifyOTP()');
      
      const result = await authService.verifyOTP(validatedData.email, validatedData.otp);
      console.log('[AUTH_CONTROLLER] OTP verification successful');
      console.log('[AUTH_CONTROLLER] User data:', { 
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role 
      });
      console.log('[AUTH_CONTROLLER] Tokens generated:', { 
        hasAccessToken: !!result.accessToken, 
        hasRefreshToken: !!result.refreshToken 
      });
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('[AUTH_CONTROLLER] OTP verification error:', error);
      if (error instanceof z.ZodError) {
        console.error('[AUTH_CONTROLLER] Validation error:', error.errors);
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('[AUTH_CONTROLLER] login() called');
      console.log('[AUTH_CONTROLLER] Request body:', { 
        email: req.body.email,
        hasPassword: !!req.body.password 
      });
      
      const validatedData = loginSchema.parse(req.body);
      console.log('[AUTH_CONTROLLER] Validation passed');
      console.log('[AUTH_CONTROLLER] Calling authService.login()');
      
      const result = await authService.login(validatedData.email, validatedData.password);
      console.log('[AUTH_CONTROLLER] Login successful');
      console.log('[AUTH_CONTROLLER] User data:', { 
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role 
      });
      console.log('[AUTH_CONTROLLER] Tokens generated:', { 
        hasAccessToken: !!result.accessToken, 
        hasRefreshToken: !!result.refreshToken 
      });
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('[AUTH_CONTROLLER] Login error:', error);
      if (error instanceof z.ZodError) {
        console.error('[AUTH_CONTROLLER] Validation error:', error.errors);
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async resendOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = resendOTPSchema.parse(req.body);
      const result = await authService.resendOTP(validatedData.email);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await authService.getCurrentUser(req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In a production app, you would invalidate the refresh token here
      // For now, we'll just return success
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth callback handler
  async googleAuthCallback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Passport attaches the user data to req.user after successful authentication
      const authData = req.user as any;
      
      if (!authData || !authData.accessToken) {
        throw new AppError('Authentication failed', 401);
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Redirect to frontend with tokens in URL (will be stored in localStorage)
      // In production, consider using httpOnly cookies instead
      const redirectUrl = `${frontendUrl}/auth/google/success?accessToken=${authData.accessToken}&refreshToken=${authData.refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
  }
}