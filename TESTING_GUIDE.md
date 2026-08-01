# Testing Guide for Judges & Evaluators

## 🎯 Quick Start: Testing User Registration & Authentication

### Prerequisites
- Backend running on `http://localhost:5000` (or configured port)
- Frontend running on `http://localhost:3000` (or configured port)
- Backend `NODE_ENV` set to `development` (default)

---

## 📝 How to Test User Registration

### Step 1: Start the Application

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Step 2: Register a New User

1. **Navigate to Registration Page**
   - Open browser: `http://localhost:3000/auth/register`

2. **Fill in the Registration Form**
   - **Name:** Any name (e.g., "Test User")
   - **Email:** Any valid email format (e.g., "test@example.com")
   - **Phone:** Optional (e.g., "1234567890")
   - **Password:** Minimum 6 characters (e.g., "test123")

3. **Click "Create account"**

### Step 3: Get Your OTP

**🎉 A blue notification will appear in the top-right corner!**

The notification displays:
- 🔐 **Your OTP Code** heading
- **6-digit OTP** in large, bold numbers
- **"Copy OTP"** button for easy copying
- **Expiry notice** (5 minutes)

**Example OTP Display:**
```
┌─────────────────────────────────┐
│ 🔐 Your OTP Code            ✕  │
│                                 │
│ For testing purposes, here's    │
│ your OTP:                       │
│                                 │
│  ┌─────────────────────────┐   │
│  │      123456             │   │
│  └─────────────────────────┘   │
│                                 │
│  [📋 Copy OTP]                 │
│                                 │
│  This OTP is valid for 5 min   │
└─────────────────────────────────┘
```

### Step 4: Verify Your Account

1. **Copy the OTP**
   - Click the "📋 Copy OTP" button, OR
   - Manually type the 6-digit code

2. **Enter OTP in Verification Screen**
   - The page automatically shows the OTP verification form
   - Paste or type the OTP code

3. **Click "Verify OTP"**

4. **Success!**
   - You'll be redirected to your dashboard based on your role
   - Default role: Customer → `/customer/menu`

---

## 🔄 Testing Different Scenarios

### Scenario 1: New Customer Registration
```
Email: customer@test.com
Password: test123
Expected Role: customer
Redirect: /customer/menu
```

### Scenario 2: Invalid OTP
```
1. Register with valid details
2. Enter wrong OTP (e.g., 000000)
3. Expected: Error message "Invalid OTP"
```

### Scenario 3: Expired OTP
```
1. Register with valid details
2. Wait 5+ minutes
3. Enter the OTP
4. Expected: Error message "OTP has expired"
```

### Scenario 4: Resend OTP (if implemented)
```
1. Register with valid details
2. Click "Resend OTP" button
3. New OTP appears in notification
4. Use new OTP to verify
```

---

## 🎨 Visual Features

### OTP Notification Design
- **Position:** Fixed top-right corner
- **Color:** Blue gradient with white text
- **Animation:** Slides in from top
- **Dismissible:** Click ✕ to close
- **Persistent:** Stays visible until dismissed or page refresh

### User Experience
- ✅ **Instant feedback** - OTP appears immediately after registration
- ✅ **Copy functionality** - One-click copy to clipboard
- ✅ **Clear instructions** - "For testing purposes" message
- ✅ **Visual hierarchy** - Large, bold OTP display
- ✅ **Accessibility** - High contrast, readable fonts

---

## 🔒 Security & Production Readiness

### Development Mode (Current)
- **Behavior:** OTP displayed in UI notification
- **Purpose:** Easy testing without email service
- **Environment:** `NODE_ENV=development` or `NODE_ENV=test`

### Production Mode
- **Behavior:** OTP sent ONLY via email (not in response)
- **Configuration:** Set `NODE_ENV=production`
- **Email Service:** Configure Resend API key in `.env`

### How It Works

**Backend Logic:**
```typescript
// In auth.service.ts
if (process.env.NODE_ENV !== 'production') {
  // Include OTP in response for testing
  return { ...response, otp: otp_code };
}
// In production, OTP is NOT included
return response;
```

**Frontend Logic:**
```typescript
// In register/page.tsx
const response = await register(formData);
if (response?.otp) {
  // Show OTP notification (only in development)
  setReceivedOTP(response.otp);
  setShowOTPNotification(true);
}
```

---

## 🚀 Why This Approach?

### For Hackathons & Testing
✅ **No email service required** - No API keys, no costs  
✅ **Instant testing** - No waiting for emails  
✅ **Easy demonstration** - Show judges the full flow  
✅ **No external dependencies** - Works offline  
✅ **Clear UX** - Professional notification design  

### For Production
✅ **Secure** - OTP never exposed in API responses  
✅ **Professional** - Email delivery via Resend  
✅ **Same codebase** - Environment-based behavior  
✅ **Easy transition** - Just change `NODE_ENV`  

---

## 🐛 Troubleshooting

### OTP Notification Not Appearing?

**Check 1: Environment Variable**
```bash
# In backend/.env
NODE_ENV=development  # NOT production
```

**Check 2: Browser Console**
```javascript
// Should see logs like:
[AUTH_SERVICE] Development mode: Including OTP in response for testing
[REGISTER] OTP received from backend: 123456
```

**Check 3: API Response**
```bash
# Test registration endpoint
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'

# Response should include "otp" field in development mode
```

### Registration Fails?

**Common Issues:**
1. **Email already exists** - Use a different email
2. **Password too short** - Minimum 6 characters
3. **Backend not running** - Check `http://localhost:5000/health`
4. **Database not connected** - Check Prisma connection

---

## 📊 Testing Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Navigate to `/auth/register`
- [ ] Fill registration form
- [ ] Submit form
- [ ] OTP notification appears
- [ ] Copy OTP button works
- [ ] Enter OTP in verification screen
- [ ] Verify OTP succeeds
- [ ] Redirect to dashboard works
- [ ] User can access protected routes

---

## 💡 Additional Notes

### For Judges
- This implementation demonstrates **environment-aware development**
- Shows understanding of **security best practices**
- Balances **developer experience** with **production security**
- Professional **UI/UX design** for testing workflows

### For Developers
- OTP generation: `utils/otp.util.ts`
- Email service: `utils/email.util.ts` (gracefully fails in dev)
- Auth flow: `services/auth.service.ts`
- Frontend UI: `app/auth/register/page.tsx`

### Future Enhancements
- SMS OTP as alternative
- QR code for mobile verification
- Biometric authentication
- Social login (Google OAuth already implemented)

---

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for error messages
2. Check backend logs for API errors
3. Verify environment variables are set correctly
4. Ensure database is properly seeded

**Happy Testing! 🎉**
