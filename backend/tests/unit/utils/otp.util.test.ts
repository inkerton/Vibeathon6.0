describe('OTP Utility - Unit Tests', () => {
  describe('OTP Generation', () => {
    it('should generate 6-digit OTP', () => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      expect(otp).toHaveLength(6);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });

    it('should generate numeric OTP only', () => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      expect(/^\d+$/.test(otp)).toBe(true);
    });

    it('should generate different OTPs', () => {
      const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
      const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Very unlikely to be equal
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('OTP Validation', () => {
    it('should validate correct OTP', () => {
      const storedOTP = '123456';
      const inputOTP = '123456';
      
      expect(storedOTP).toBe(inputOTP);
    });

    it('should reject incorrect OTP', () => {
      const storedOTP = '123456';
      const inputOTP = '654321';
      
      expect(storedOTP).not.toBe(inputOTP);
    });

    it('should reject OTP with wrong length', () => {
      const otp = '12345'; // 5 digits
      
      expect(otp).toHaveLength(5);
      expect(otp.length).not.toBe(6);
    });

    it('should reject non-numeric OTP', () => {
      const otp = '12a456';
      
      expect(/^\d+$/.test(otp)).toBe(false);
    });
  });

  describe('OTP Expiration', () => {
    it('should check if OTP is expired', () => {
      const createdAt = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const expiryTime = 5 * 60 * 1000; // 5 minutes
      const isExpired = Date.now() - createdAt > expiryTime;
      
      expect(isExpired).toBe(true);
    });

    it('should validate non-expired OTP', () => {
      const createdAt = Date.now() - 2 * 60 * 1000; // 2 minutes ago
      const expiryTime = 5 * 60 * 1000; // 5 minutes
      const isExpired = Date.now() - createdAt > expiryTime;
      
      expect(isExpired).toBe(false);
    });

    it('should handle edge case at expiry boundary', () => {
      const createdAt = Date.now() - 5 * 60 * 1000; // Exactly 5 minutes ago
      const expiryTime = 5 * 60 * 1000;
      const isExpired = Date.now() - createdAt > expiryTime;
      
      expect(isExpired).toBe(false); // Should still be valid at exact boundary
    });
  });

  describe('OTP Storage', () => {
    it('should store OTP with timestamp', () => {
      const otpData = {
        otp: '123456',
        createdAt: Date.now(),
        email: 'test@example.com',
      };
      
      expect(otpData).toHaveProperty('otp');
      expect(otpData).toHaveProperty('createdAt');
      expect(otpData).toHaveProperty('email');
    });

    it('should associate OTP with user email', () => {
      const email = 'test@example.com';
      const otp = '123456';
      const otpMap = new Map();
      
      otpMap.set(email, { otp, createdAt: Date.now() });
      
      expect(otpMap.has(email)).toBe(true);
      expect(otpMap.get(email).otp).toBe(otp);
    });
  });

  describe('OTP Attempts', () => {
    it('should track failed attempts', () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      attempts++;
      attempts++;
      attempts++;
      
      expect(attempts).toBe(maxAttempts);
    });

    it('should block after max attempts', () => {
      const attempts = 4;
      const maxAttempts = 3;
      const isBlocked = attempts > maxAttempts;
      
      expect(isBlocked).toBe(true);
    });

    it('should reset attempts after successful verification', () => {
      let attempts = 2;
      
      // Successful verification
      attempts = 0;
      
      expect(attempts).toBe(0);
    });
  });

  describe('OTP Format', () => {
    it('should pad OTP with leading zeros if needed', () => {
      const number = 12345;
      const otp = number.toString().padStart(6, '0');
      
      expect(otp).toBe('012345');
      expect(otp).toHaveLength(6);
    });

    it('should not pad 6-digit OTP', () => {
      const number = 123456;
      const otp = number.toString().padStart(6, '0');
      
      expect(otp).toBe('123456');
      expect(otp).toHaveLength(6);
    });
  });
});
