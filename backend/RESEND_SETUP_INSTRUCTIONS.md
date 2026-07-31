# Resend Email Setup Instructions

## 🚀 Quick Start Guide

Follow these steps to complete the Resend email integration:

---

## Step 1: Install Dependencies

Run the following commands in the `backend` directory:

```bash
cd backend

# Remove old nodemailer packages
npm uninstall nodemailer @types/nodemailer

# Install Resend
npm install resend
```

---

## Step 2: Get Your Resend API Key

### 2.1 Sign Up for Resend
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2.2 Create an API Key
1. Log in to your Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "Restaurant Backend")
5. Copy the API key (it starts with `re_`)
   - ⚠️ **Important**: Save this key immediately - you won't be able to see it again!

---

## Step 3: Configure Environment Variables

### 3.1 Update Your `.env` File

Add the following to your `backend/.env` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=onboarding@yourdomain.com
```

**Replace:**
- `re_xxxxxxxxx` with your actual Resend API key from Step 2
- `onboarding@yourdomain.com` with your verified domain email

### 3.2 Remove Old SMTP Variables

You can now remove these old environment variables (if they exist):
```env
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASSWORD
```

---

## Step 4: Verify Your Domain (Important!)

### Why Domain Verification?
Resend requires you to verify your domain before sending emails. This ensures better deliverability and prevents spam.

### 4.1 Add Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)

### 4.2 Configure DNS Records
1. Resend will provide DNS records (TXT, CNAME, MX)
2. Add these records to your domain's DNS settings
3. Wait for verification (usually 5-15 minutes)

### 4.3 For Development/Testing
If you don't have a domain yet, you can use Resend's test domain:
```env
EMAIL_FROM=onboarding@resend.dev
```

⚠️ **Note**: The test domain has limitations and should only be used for development.

---

## Step 5: Test the Integration

### 5.1 Start Your Backend Server
```bash
npm run dev
```

### 5.2 Test OTP Email
Try logging in or requesting an OTP. Check the console logs for:
```
[EMAIL_UTIL] ✅ Email sent successfully!
[EMAIL_UTIL] Email ID: <email-id>
```

### 5.3 Check Resend Dashboard
1. Go to **Logs** in Resend dashboard
2. You should see your sent emails
3. Check delivery status and any errors

---

## Step 6: Run Tests

Ensure all tests pass with the new email utility:

```bash
# Run all tests
npm test

# Run specific email-related tests
npm run test:unit
```

---

## 📋 Configuration Checklist

- [ ] Nodemailer packages uninstalled
- [ ] Resend package installed
- [ ] Resend API key obtained
- [ ] `.env` file updated with `RESEND_API_KEY`
- [ ] `.env` file updated with `EMAIL_FROM`
- [ ] Old SMTP variables removed from `.env`
- [ ] Domain verified in Resend dashboard (or using test domain)
- [ ] Backend server starts without errors
- [ ] OTP emails sending successfully
- [ ] Reservation emails sending successfully
- [ ] Tests passing

---

## 🔧 Troubleshooting

### Issue: "Invalid API key" Error
**Solution**: 
- Double-check your API key in `.env`
- Ensure there are no extra spaces or quotes
- Verify the key starts with `re_`

### Issue: "Domain not verified" Error
**Solution**:
- Complete domain verification in Resend dashboard
- Or use `onboarding@resend.dev` for testing

### Issue: Emails Not Sending
**Solution**:
1. Check console logs for detailed error messages
2. Verify `RESEND_API_KEY` is set correctly
3. Check Resend dashboard logs for delivery status
4. Ensure `EMAIL_FROM` uses a verified domain

### Issue: Tests Failing
**Solution**:
- The test environment skips actual email sending
- Check if test mocks need updating
- Verify `NODE_ENV=test` is set during testing

---

## 📚 Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **Node.js Guide**: https://resend.com/docs/send-with-nodejs
- **TypeScript Examples**: https://resend.com/docs/send-with-typescript
- **API Reference**: https://resend.com/docs/api-reference
- **Domain Verification Guide**: https://resend.com/docs/dashboard/domains/introduction

---

## 🔐 Security Best Practices

1. **Never commit API keys**: Ensure `.env` is in `.gitignore`
2. **Use environment variables**: Never hardcode API keys in code
3. **Rotate keys regularly**: Create new API keys periodically
4. **Use different keys**: Separate keys for development and production
5. **Monitor usage**: Check Resend dashboard for unusual activity

---

## 🎯 What Changed?

### Files Modified:
1. ✅ `backend/package.json` - Dependencies updated
2. ✅ `backend/src/utils/email.util.ts` - Refactored to use Resend
3. ✅ `backend/.env.example` - Updated with new variables

### Key Improvements:
- ✨ Simpler configuration (no SMTP setup needed)
- 📊 Better email analytics and tracking
- 🚀 Improved deliverability
- 🔧 Modern TypeScript API
- 📝 Structured error handling

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Resend documentation
3. Check console logs for detailed error messages
4. Verify all environment variables are set correctly

---

## ✅ You're All Set!

Once you've completed all steps in the checklist, your email integration is ready to use. The system will now send OTP and reservation confirmation emails using Resend's reliable infrastructure.

Happy coding! 🎉
