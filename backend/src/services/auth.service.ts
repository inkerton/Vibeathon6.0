import bcrypt from 'bcrypt';
import { PrismaClient, Role, AuthProvider } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.util';
import { generateOTP, getOTPExpiryTime, isOTPExpired } from '../utils/otp.util';
import { sendOTPEmail } from '../utils/email.util';
import prisma from '../config/database';

export class AuthService {

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
  }) {
    console.log('[AUTH_SERVICE] register() called');
    console.log('[AUTH_SERVICE] Registration data:', { 
      name: data.name, 
      email: data.email, 
      phone: data.phone,
      role: data.role || 'customer',
      hasPassword: !!data.password 
    });
    
    // Check if user already exists
    console.log('[AUTH_SERVICE] Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('[AUTH_SERVICE] User already exists');
      throw new AppError('User with this email already exists', 409);
    }
    console.log('[AUTH_SERVICE] User does not exist, proceeding with registration');

    // Hash password
    console.log('[AUTH_SERVICE] Hashing password...');
    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const password_hash = await bcrypt.hash(data.password, saltRounds);
    console.log('[AUTH_SERVICE] Password hashed successfully');

    
    // Generate OTP
    console.log('[AUTH_SERVICE] Generating OTP...');
    const otp_code = generateOTP();
    const otp_expires_at = getOTPExpiryTime();
    console.log('[AUTH_SERVICE] OTP generated:', otp_code);
    console.log('[AUTH_SERVICE] OTP expires at:', otp_expires_at);

    // Create user
    console.log('[AUTH_SERVICE] Creating user in database...');
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password_hash,
        auth_provider: AuthProvider.local,
        role: data.role || Role.customer,
        is_active: false, // Will be activated after OTP verification
        otp_code,
        otp_expires_at,
      },
    });
    console.log('[AUTH_SERVICE] User created successfully:', { id: user.id, email: user.email, role: user.role });

    // Send OTP email
    console.log('[AUTH_SERVICE] Sending OTP email...');
    try {
      await sendOTPEmail(user.email, otp_code);
      console.log('[AUTH_SERVICE] OTP email sent successfully');
    } catch (error) {
      console.error('[AUTH_SERVICE] Failed to send OTP email:', error);
      // Don't fail registration if email fails
    }

    console.log('[AUTH_SERVICE] Registration completed successfully');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      message: 'Registration successful. Please verify your email with the OTP sent.',
    };
  }

  async verifyOTP(email: string, otp: string) {
    console.log('[AUTH_SERVICE] verifyOTP() called');
    console.log('[AUTH_SERVICE] Email:', email);
    console.log('[AUTH_SERVICE] OTP:', otp);
    
    console.log('[AUTH_SERVICE] Finding user...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('[AUTH_SERVICE] User not found');
      throw new AppError('User not found', 404);
    }
    console.log('[AUTH_SERVICE] User found:', { id: user.id, email: user.email, isActive: user.is_active });

    if (!user.otp_code || !user.otp_expires_at) {
      console.log('[AUTH_SERVICE] No OTP found for user');
      throw new AppError('No OTP found for this user', 400);
    }
    console.log('[AUTH_SERVICE] Stored OTP:', user.otp_code);
    console.log('[AUTH_SERVICE] OTP expires at:', user.otp_expires_at);

    if (isOTPExpired(user.otp_expires_at)) {
      console.log('[AUTH_SERVICE] OTP has expired');
      throw new AppError('OTP has expired', 400);
    }
    console.log('[AUTH_SERVICE] OTP is not expired');

    if (user.otp_code !== otp) {
      console.log('[AUTH_SERVICE] Invalid OTP - mismatch');
      throw new AppError('Invalid OTP', 400);
    }
    console.log('[AUTH_SERVICE] OTP is valid');

    // Activate user and clear OTP
    console.log('[AUTH_SERVICE] Activating user and clearing OTP...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_active: true,
        otp_code: null,
        otp_expires_at: null,
      },
    });
    console.log('[AUTH_SERVICE] User activated successfully');

    // Generate tokens
    console.log('[AUTH_SERVICE] Generating tokens...');
    const tokenPayload: TokenPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    console.log('[AUTH_SERVICE] Tokens generated successfully');
    console.log('[AUTH_SERVICE] User role:', updatedUser.role);

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    console.log('[AUTH_SERVICE] login() called');
    console.log('[AUTH_SERVICE] Email:', email);
    
    console.log('[AUTH_SERVICE] Finding user...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('[AUTH_SERVICE] User not found');
      throw new AppError('Invalid credentials', 401);
    }
    console.log('[AUTH_SERVICE] User found:', { id: user.id, email: user.email, role: user.role, isActive: user.is_active, authProvider: user.auth_provider });

    if (!user.is_active) {
      console.log('[AUTH_SERVICE] Account not activated');
      throw new AppError('Account not activated. Please verify your email.', 401);
    }
    console.log('[AUTH_SERVICE] Account is active');

    if (user.auth_provider !== AuthProvider.local) {
      console.log('[AUTH_SERVICE] Wrong auth provider:', user.auth_provider);
      throw new AppError('Please use Google login for this account', 400);
    }
    console.log('[AUTH_SERVICE] Auth provider is local');

    if (!user.password_hash) {
      console.log('[AUTH_SERVICE] No password hash found');
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    console.log('[AUTH_SERVICE] Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('[AUTH_SERVICE] Invalid password');
      throw new AppError('Invalid credentials', 401);
    }
    console.log('[AUTH_SERVICE] Password is valid');

    // Generate tokens
    console.log('[AUTH_SERVICE] Generating tokens...');
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    console.log('[AUTH_SERVICE] Tokens generated successfully');
    console.log('[AUTH_SERVICE] User role:', user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async googleAuth(profile: {
    id: string;
    email: string;
    name: string;
  }) {
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          auth_provider: AuthProvider.google,
          role: Role.customer,
          is_active: true, // Google users are auto-activated
        },
      });
    } else if (user.auth_provider !== AuthProvider.google) {
      throw new AppError('Email already registered with password login', 409);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async resendOTP(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.is_active) {
      throw new AppError('Account already activated', 400);
    }

    // Generate new OTP
    const otp_code = generateOTP();
    const otp_expires_at = getOTPExpiryTime();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code,
        otp_expires_at,
      },
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp_code);

    return {
      message: 'OTP sent successfully',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as TokenPayload;
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.is_active) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
}
