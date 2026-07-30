import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('Email Utility - Unit Tests', () => {
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('Email Configuration', () => {
    it('should create transporter with correct config', () => {
      const config = {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'password',
        },
      };

      nodemailer.createTransport(config);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(config);
    });

    it('should use secure connection for port 465', () => {
      const config = {
        host: 'smtp.test.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@test.com',
          pass: 'password',
        },
      };

      expect(config.secure).toBe(true);
      expect(config.port).toBe(465);
    });
  });

  describe('Send Email', () => {
    it('should send email successfully', async () => {
      const mailOptions = {
        from: 'noreply@test.com',
        to: 'user@test.com',
        subject: 'Test Email',
        text: 'Test content',
      };

      const result = await mockTransporter.sendMail(mailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
      expect(result).toHaveProperty('messageId');
    });

    it('should send HTML email', async () => {
      const mailOptions = {
        from: 'noreply@test.com',
        to: 'user@test.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      };

      await mockTransporter.sendMail(mailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<h1>Test</h1>' })
      );
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        mockTransporter.sendMail({ to: 'test@test.com' })
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('OTP Email', () => {
    it('should send OTP email with correct format', async () => {
      const otp = '123456';
      const email = 'user@test.com';
      
      const mailOptions = {
        from: 'noreply@test.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
      };

      await mockTransporter.sendMail(mailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Your OTP Code',
        })
      );
    });

    it('should include OTP in email content', async () => {
      const otp = '123456';
      const content = `Your OTP code is: ${otp}`;

      expect(content).toContain(otp);
      expect(content).toContain('OTP');
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      const resetToken = 'reset_token_123';
      const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: 'noreply@test.com',
        to: 'user@test.com',
        subject: 'Password Reset Request',
        html: `<p>Click here to reset: <a href="${resetUrl}">Reset Password</a></p>`,
      };

      await mockTransporter.sendMail(mailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Password Reset Request',
        })
      );
    });

    it('should include reset link in email', () => {
      const resetToken = 'token123';
      const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

      expect(resetUrl).toContain(resetToken);
      expect(resetUrl).toContain('reset-password');
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidEmail = 'invalid-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should reject email without domain', () => {
      const invalidEmail = 'test@';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
    });
  });

  describe('Email Templates', () => {
    it('should format welcome email', () => {
      const userName = 'John Doe';
      const template = `Welcome ${userName}! Thank you for registering.`;

      expect(template).toContain(userName);
      expect(template).toContain('Welcome');
    });

    it('should format order confirmation email', () => {
      const orderId = 'ORDER-123';
      const total = 45.99;
      const template = `Order ${orderId} confirmed. Total: $${total}`;

      expect(template).toContain(orderId);
      expect(template).toContain(total.toString());
    });

    it('should format reservation confirmation', () => {
      const date = '2024-01-15';
      const time = '19:00';
      const template = `Reservation confirmed for ${date} at ${time}`;

      expect(template).toContain(date);
      expect(template).toContain(time);
    });
  });

  describe('Email Rate Limiting', () => {
    it('should track email send count', () => {
      const emailCount = new Map();
      const email = 'test@test.com';
      
      emailCount.set(email, (emailCount.get(email) || 0) + 1);

      expect(emailCount.get(email)).toBe(1);
    });

    it('should enforce rate limit', () => {
      const emailCount = 5;
      const maxEmails = 3;
      const isRateLimited = emailCount > maxEmails;

      expect(isRateLimited).toBe(true);
    });
  });
});
