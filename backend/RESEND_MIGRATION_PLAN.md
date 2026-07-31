# Resend Email Migration Plan

## Overview
This document outlines the complete migration from Nodemailer to Resend API for the email utility in the backend service.

## Current State Analysis

### Existing Email Functions
1. **`sendOTPEmail()`** - Sends OTP codes for authentication
2. **`sendReservationConfirmation()`** - Sends reservation confirmation emails

### Current Dependencies
- `nodemailer` - SMTP-based email sending
- `@types/nodemailer` - TypeScript types

### Current Environment Variables
```
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASSWORD
EMAIL_FROM
```

## Migration Strategy

### 1. Package Changes

**Remove:**
```json
"nodemailer": "^6.10.1"
"@types/nodemailer": "^6.4.17"
```

**Add:**
```json
"resend": "^4.0.0"
```

**Commands:**
```bash
npm uninstall nodemailer @types/nodemailer
npm install resend
```

### 2. Environment Variables Update

**Remove (no longer needed):**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

**Add:**
```env
RESEND_API_KEY=re_xxxxxxxxx
```

**Keep:**
- `EMAIL_FROM` (or update to use verified Resend domain)

### 3. Code Migration

#### File: `backend/src/utils/email.util.ts`

**Before (Nodemailer):**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

**After (Resend):**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
```

### 4. Function Refactoring

#### `sendOTPEmail()` Function

**Key Changes:**
- Replace `transporter.sendMail()` with `resend.emails.send()`
- Update error handling to use Resend's `{ data, error }` pattern
- Maintain test environment skip logic
- Keep existing HTML template structure

**New Implementation Pattern:**
```typescript
const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
  to: [email],
  subject: 'Your OTP for Restaurant Login',
  html: `...existing HTML template...`
});

if (error) {
  console.error('[EMAIL_UTIL] ❌ Error sending OTP email:', error);
  // Don't throw in production, just log the error
  return;
}

console.log('[EMAIL_UTIL] ✅ Email sent successfully!');
console.log('[EMAIL_UTIL] Email ID:', data.id);
```

#### `sendReservationConfirmation()` Function

**Key Changes:**
- Same pattern as OTP email
- Update to Resend API structure
- Maintain existing HTML template

### 5. Error Handling Improvements

**Resend Error Pattern:**
```typescript
const { data, error } = await resend.emails.send({...});

if (error) {
  // Error object contains detailed information
  console.error('Error details:', error);
  return; // or throw based on requirements
}

// Success - data contains email ID and other metadata
console.log('Email sent with ID:', data.id);
```

### 6. Testing Considerations

**Test Environment:**
- Keep the `NODE_ENV === 'test'` check to skip actual email sending
- Update mock implementations if needed

**Integration Tests:**
- Update any email-related tests to mock Resend instead of Nodemailer
- Test error handling with Resend's error structure

## Implementation Steps

### Step 1: Update package.json
```bash
cd backend
npm uninstall nodemailer @types/nodemailer
npm install resend
```

### Step 2: Update Environment Variables
1. Add `RESEND_API_KEY=re_xxxxxxxxx` to `.env` file
2. **IMPORTANT:** Replace `re_xxxxxxxxx` with your actual Resend API key
3. Update `EMAIL_FROM` to use your verified Resend domain (e.g., `onboarding@yourdomain.com`)
4. Remove old SMTP variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD)

### Step 3: Update email.util.ts
1. Replace nodemailer import with Resend
2. Initialize Resend client with API key
3. Refactor `sendOTPEmail()` function
4. Refactor `sendReservationConfirmation()` function
5. Update error handling throughout

### Step 4: Verify Domain in Resend
1. Log in to Resend dashboard
2. Add and verify your domain
3. Update `EMAIL_FROM` environment variable with verified domain

### Step 5: Test the Implementation
1. Run unit tests: `npm run test:unit`
2. Test OTP email sending in development
3. Test reservation confirmation emails
4. Verify error handling works correctly

## Resend API Key Setup

### Getting Your API Key
1. Sign up at https://resend.com
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)
5. Add to `.env` file: `RESEND_API_KEY=re_your_actual_key_here`

### Domain Verification
1. Add your domain in Resend dashboard
2. Add DNS records as instructed
3. Wait for verification (usually a few minutes)
4. Use verified domain in `from` field

## Benefits of Migration

### Advantages of Resend
1. **Simpler Setup** - No SMTP configuration needed
2. **Better Deliverability** - Optimized for transactional emails
3. **Modern API** - RESTful API with TypeScript support
4. **Built-in Features** - Templates, scheduling, webhooks
5. **Better Error Handling** - Structured error responses
6. **Analytics** - Built-in email tracking and analytics

### Code Improvements
1. Cleaner, more maintainable code
2. Better TypeScript support
3. Simplified error handling
4. No need for SMTP credentials management

## Rollback Plan

If issues arise, rollback steps:
1. Reinstall nodemailer: `npm install nodemailer @types/nodemailer`
2. Restore old environment variables
3. Revert `email.util.ts` changes (use git)
4. Restart the application

## Post-Migration Checklist

- [ ] Package.json updated (resend added, nodemailer removed)
- [ ] Environment variables updated with RESEND_API_KEY
- [ ] Domain verified in Resend dashboard
- [ ] email.util.ts refactored to use Resend
- [ ] All email functions tested
- [ ] Error handling verified
- [ ] Test environment skip logic working
- [ ] Production deployment successful
- [ ] Email deliverability confirmed

## Additional Resources

- Resend Documentation: https://resend.com/docs
- Resend Node.js Guide: https://resend.com/docs/send-with-nodejs
- Resend TypeScript Examples: https://resend.com/docs/send-with-typescript
- API Reference: https://resend.com/docs/api-reference

## Notes

- **API Key Security**: Never commit the API key to version control
- **Rate Limits**: Check Resend's rate limits for your plan
- **From Address**: Must use a verified domain
- **Testing**: Use Resend's test mode for development
- **Monitoring**: Set up webhooks for delivery tracking

## Next Steps

After reviewing this plan:
1. Switch to `code` mode to implement the changes
2. Follow the implementation steps sequentially
3. Test thoroughly before deploying to production
