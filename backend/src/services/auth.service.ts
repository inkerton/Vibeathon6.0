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
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    
    // Generate OTP
    const otp_code = generateOTP();
    const otp_expires_at = getOTPExpiryTime();

    // Create user
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

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp_code);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Don't fail registration if email fails
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      message: 'Registration successful. Please verify your email with the OTP sent.',
    };
  }

  async verifyOTP(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.otp_code || !user.otp_expires_at) {
      throw new AppError('No OTP found for this user', 400);
    }

    if (isOTPExpired(user.otp_expires_at)) {
      throw new AppError('OTP has expired', 400);
    }

    if (user.otp_code !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Activate user and clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_active: true,
        otp_code: null,
        otp_expires_at: null,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account not activated. Please verify your email.', 401);
    }

    if (user.auth_provider !== AuthProvider.local) {
      throw new AppError('Please use Google login for this account', 400);
    }

    if (!user.password_hash) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
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
}
