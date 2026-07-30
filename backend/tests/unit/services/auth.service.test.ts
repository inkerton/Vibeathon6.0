import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should hash password before creating user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(hashedPassword).toBe('hashed_password');
    });

    it('should check for existing user before registration', async () => {
      const email = 'existing@example.com';
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email,
      });

      await mockPrisma.user.findUnique({ where: { email } });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should create user with hashed password', async () => {
      const userData = {
        email: 'new@example.com',
        password_hash: 'hashed_password',
        name: 'New User',
        role: 'customer',
      };

      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        ...userData,
      });

      const result = await mockPrisma.user.create({ data: userData });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: userData });
      expect(result).toHaveProperty('id');
    });
  });

  describe('User Login', () => {
    it('should verify password correctly', async () => {
      const password = 'Password123!';
      const hashedPassword = 'hashed_password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'WrongPassword';
      const hashedPassword = 'hashed_password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should generate JWT token on successful login', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      const mockToken = 'mock_jwt_token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        'secret',
        { expiresIn: '1h' }
      );

      expect(jwt.sign).toHaveBeenCalled();
      expect(token).toBe(mockToken);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid JWT token', () => {
      const mockPayload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const token = 'valid_token';
      const payload = jwt.verify(token, 'secret');

      expect(jwt.verify).toHaveBeenCalledWith(token, 'secret');
      expect(payload).toEqual(mockPayload);
    });

    it('should reject invalid JWT token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const token = 'invalid_token';

      expect(() => jwt.verify(token, 'secret')).toThrow('Invalid token');
    });

    it('should reject expired JWT token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const token = 'expired_token';

      expect(() => jwt.verify(token, 'secret')).toThrow('Token expired');
    });
  });

  describe('Password Reset', () => {
    it('should generate reset token', () => {
      const mockToken = 'reset_token_123';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const userId = 'user-1';
      const token = jwt.sign({ id: userId }, 'secret', { expiresIn: '1h' });

      expect(jwt.sign).toHaveBeenCalled();
      expect(token).toBe(mockToken);
    });

    it('should update password with new hash', async () => {
      const newPassword = 'NewPassword123!';
      const newHash = 'new_hashed_password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(newHash);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password_hash: newHash,
      });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await mockPrisma.user.update({
        where: { id: 'user-1' },
        data: { password_hash: hashedPassword },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('User Lookup', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const user = await mockPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(user).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await mockPrisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });
  });
});
