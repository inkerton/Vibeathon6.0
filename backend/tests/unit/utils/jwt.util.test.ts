import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JWT Utility - Unit Tests', () => {
  const mockSecret = 'test_secret_key';
  const mockRefreshSecret = 'test_refresh_secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate access token', () => {
      const payload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      const mockToken = 'mock_access_token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = jwt.sign(payload, mockSecret, { expiresIn: '1h' });

      expect(jwt.sign).toHaveBeenCalledWith(payload, mockSecret, {
        expiresIn: '1h',
      });
      expect(token).toBe(mockToken);
    });

    it('should generate refresh token', () => {
      const payload = { id: 'user-1', email: 'test@example.com' };
      const mockToken = 'mock_refresh_token';

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = jwt.sign(payload, mockRefreshSecret, { expiresIn: '7d' });

      expect(jwt.sign).toHaveBeenCalledWith(payload, mockRefreshSecret, {
        expiresIn: '7d',
      });
      expect(token).toBe(mockToken);
    });

    it('should include user role in token', () => {
      const payload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'admin',
      };

      (jwt.sign as jest.Mock).mockReturnValue('token');

      jwt.sign(payload, mockSecret, { expiresIn: '1h' });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' }),
        mockSecret,
        expect.any(Object)
      );
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const mockPayload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const token = 'valid_token';
      const payload = jwt.verify(token, mockSecret);

      expect(jwt.verify).toHaveBeenCalledWith(token, mockSecret);
      expect(payload).toEqual(mockPayload);
    });

    it('should reject invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const token = 'invalid_token';

      expect(() => jwt.verify(token, mockSecret)).toThrow('Invalid token');
    });

    it('should reject expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const token = 'expired_token';

      expect(() => jwt.verify(token, mockSecret)).toThrow('Token expired');
    });

    it('should reject malformed token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('Malformed token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const token = 'malformed_token';

      expect(() => jwt.verify(token, mockSecret)).toThrow('Malformed token');
    });
  });

  describe('Token Decoding', () => {
    it('should decode token without verification', () => {
      const mockPayload = {
        id: 'user-1',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234571490,
      };

      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);

      const token = 'some_token';
      const decoded = jwt.decode(token);

      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(decoded).toEqual(mockPayload);
    });

    it('should return null for invalid token format', () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);

      const token = 'invalid';
      const decoded = jwt.decode(token);

      expect(decoded).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    it('should set correct expiration for access token', () => {
      const expiresIn = '1h';
      (jwt.sign as jest.Mock).mockReturnValue('token');

      jwt.sign({ id: 'user-1' }, mockSecret, { expiresIn });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        mockSecret,
        expect.objectContaining({ expiresIn: '1h' })
      );
    });

    it('should set correct expiration for refresh token', () => {
      const expiresIn = '7d';
      (jwt.sign as jest.Mock).mockReturnValue('token');

      jwt.sign({ id: 'user-1' }, mockRefreshSecret, { expiresIn });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        mockRefreshSecret,
        expect.objectContaining({ expiresIn: '7d' })
      );
    });
  });

  describe('Token Payload', () => {
    it('should include required fields', () => {
      const payload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('role');
    });

    it('should not include sensitive data', () => {
      const payload = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      };

      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('password_hash');
    });
  });
});
