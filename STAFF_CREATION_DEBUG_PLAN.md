# Staff Creation 400 Error - Debug Plan

## Error Details

**Error:** `AxiosError: Request failed with status code 400`
**Location:** `frontend/app/admin/staff/page.tsx:121:15`
**Action:** Creating new staff member

## Current Implementation Analysis

### Frontend Request (✅ Correct Format)

**File:** `frontend/app/admin/staff/page.tsx` (lines 98-109)

```typescript
const response = await apiClient.post('/staff', {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  password: formData.password,
  role: formData.role,
});
```

**Data Sent:**
- `name`: string
- `email`: string
- `phone`: string (can be empty)
- `password`: string
- `role`: 'kitchen' | 'reception' | 'inventory' | 'admin'

### Backend Validation (Zod Schema)

**File:** `backend/src/controllers/staff.controller.ts` (lines 11-19)

```typescript
const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin']),
  phone: z.string().optional(),
});
```

**Requirements:**
- ✅ `name`: min 2 chars, max 100 chars
- ✅ `email`: valid email format
- ✅ `password`: min 8 chars
- ✅ `role`: must be one of the enum values
- ✅ `phone`: optional string

### API Mode Detection

**File:** `frontend/lib/api-client.ts`

```typescript
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'live';
```

**Possible Values:**
- `'mock'` - Uses mock API client
- `'live'` - Uses real backend API

## Potential Issues

### 1. Empty Phone Field ⚠️

**Problem:** Frontend might be sending empty string `""` for phone, but backend expects `undefined` or valid string.

**Frontend Form Default:**
```typescript
const [formData, setFormData] = useState<CreateStaffForm>({
  name: '',
  email: '',
  phone: '',  // ⚠️ Empty string, not undefined
  password: '',
  role: 'kitchen',
});
```

**Backend Validation:**
```typescript
phone: z.string().optional(),  // Expects string or undefined, not empty string
```

**Solution:** Don't send phone field if it's empty, or send `null`/`undefined`.

### 2. Password Length Validation ⚠️

**Problem:** User might be entering password shorter than 8 characters.

**Backend Requirement:**
```typescript
password: z.string().min(8, 'Password must be at least 8 characters')
```

**Solution:** Add frontend validation before submission.

### 3. API Mode Mismatch ⚠️

**Problem:** Frontend might be in 'live' mode but backend is not running.

**Check:**
- Is `NEXT_PUBLIC_API_MODE` set to 'mock' or 'live'?
- If 'live', is backend running on `http://localhost:5000`?

### 4. Role Value Mismatch ⚠️

**Problem:** Frontend role value might not match backend enum exactly.

**Frontend Default:**
```typescript
role: 'kitchen'  // Must match backend enum exactly
```

**Backend Enum:**
```typescript
z.enum(['reception', 'kitchen', 'inventory', 'admin'])
```

**Check:** Case sensitivity and exact string match.

### 5. CORS or Network Issues ⚠️

**Problem:** Backend might be rejecting requests due to CORS or network configuration.

**Check:**
- Backend CORS configuration
- Network connectivity
- Browser console for CORS errors

## Debugging Steps

### Step 1: Check API Mode

**Action:** Verify which API mode is active.

```bash
# Check environment variable
cd frontend
cat .env.local | grep NEXT_PUBLIC_API_MODE

# Or check in browser console
console.log(process.env.NEXT_PUBLIC_API_MODE)
```

**Expected:**
- `'mock'` - Should work without backend
- `'live'` - Requires backend running

### Step 2: Test in Mock Mode First

**Action:** Force mock mode to isolate backend issues.

```bash
cd frontend
NEXT_PUBLIC_API_MODE=mock npm run dev
```

**Test:**
1. Navigate to `/admin/staff`
2. Try creating staff member
3. If it works → Backend issue
4. If it fails → Frontend/mock issue

### Step 3: Inspect Request Payload

**Action:** Add console logging to see exact data sent.

**Add to `frontend/app/admin/staff/page.tsx` (line 102):**

```typescript
const handleCreateStaff = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setSubmitting(true);
    
    // 🔍 DEBUG: Log the exact payload
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    };
    console.log('📤 Sending staff creation request:', payload);
    console.log('📤 Password length:', payload.password.length);
    console.log('📤 Phone value:', payload.phone, 'isEmpty:', payload.phone === '');
    
    const response = await apiClient.post('/staff', payload);
    // ... rest of code
```

### Step 4: Check Backend Logs

**Action:** If in live mode, check backend console for detailed error.

```bash
cd backend
npm run dev
```

**Look for:**
- Zod validation errors
- Database connection errors
- Detailed error messages

### Step 5: Test with cURL

**Action:** Test backend directly to isolate frontend issues.

```bash
# First, login to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "admin123"
  }'

# Copy the token from response, then:
curl -X POST http://localhost:5000/api/v1/staff \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Chef",
    "email": "testchef@restaurant.com",
    "password": "testpass123",
    "role": "kitchen",
    "phone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Staff member created successfully",
  "data": { ... }
}
```

### Step 6: Validate Form Data

**Action:** Add frontend validation before submission.

**Add validation function:**

```typescript
const validateForm = () => {
  if (!formData.name || formData.name.length < 2) {
    setToast({ show: true, message: 'Name must be at least 2 characters', type: 'error' });
    return false;
  }
  
  if (!formData.email || !formData.email.includes('@')) {
    setToast({ show: true, message: 'Please enter a valid email', type: 'error' });
    return false;
  }
  
  if (!formData.password || formData.password.length < 8) {
    setToast({ show: true, message: 'Password must be at least 8 characters', type: 'error' });
    return false;
  }
  
  if (!['reception', 'kitchen', 'inventory', 'admin'].includes(formData.role)) {
    setToast({ show: true, message: 'Invalid role selected', type: 'error' });
    return false;
  }
  
  return true;
};

const handleCreateStaff = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  // ... rest of code
```

## Quick Fixes to Try

### Fix 1: Don't Send Empty Phone

**File:** `frontend/app/admin/staff/page.tsx`

**Change:**
```typescript
const payload = {
  name: formData.name,
  email: formData.email,
  password: formData.password,
  role: formData.role,
  ...(formData.phone && { phone: formData.phone }), // Only include if not empty
};

const response = await apiClient.post('/staff', payload);
```

### Fix 2: Add Frontend Validation

**Add to form:**
```typescript
<input
  type="password"
  value={formData.password}
  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  minLength={8}
  required
  placeholder="Minimum 8 characters"
/>
```

### Fix 3: Force Mock Mode

**Create/Update `.env.local`:**
```bash
cd frontend
echo "NEXT_PUBLIC_API_MODE=mock" > .env.local
```

**Restart dev server:**
```bash
npm run dev
```

## Expected Outcomes

### If Mock Mode Works
- ✅ Frontend code is correct
- ✅ Mock API client is working
- ❌ Backend has an issue (if live mode fails)

### If Mock Mode Fails
- ❌ Frontend validation issue
- ❌ Mock API client issue
- ❌ Data format issue

### If Live Mode Works After Fixes
- ✅ Issue was with empty phone field
- ✅ Issue was with password validation
- ✅ Backend is working correctly

## Next Steps After Debugging

1. **Identify Root Cause:**
   - Empty phone field?
   - Password too short?
   - Backend not running?
   - CORS issue?

2. **Apply Appropriate Fix:**
   - Update frontend to handle empty phone
   - Add frontend validation
   - Fix backend configuration
   - Update CORS settings

3. **Test Thoroughly:**
   - Test in mock mode
   - Test in live mode
   - Test with various inputs
   - Test error cases

4. **Document Solution:**
   - Update this document with findings
   - Add to project documentation
   - Create test cases

## Common Error Messages

### "Password must be at least 8 characters"
- **Cause:** Password too short
- **Fix:** Enter password with 8+ characters

### "Invalid email address"
- **Cause:** Email format invalid
- **Fix:** Enter valid email (e.g., user@example.com)

### "User with this email already exists"
- **Cause:** Email already in database
- **Fix:** Use different email or delete existing user

### "Role must be one of: reception, kitchen, inventory, admin"
- **Cause:** Invalid role value
- **Fix:** Ensure role matches enum exactly

### Network Error / CORS Error
- **Cause:** Backend not running or CORS misconfigured
- **Fix:** Start backend, check CORS settings

## Checklist

Before reporting issue as unsolvable:

- [ ] Verified API mode (mock vs live)
- [ ] Tested in mock mode
- [ ] Checked console logs for detailed errors
- [ ] Verified backend is running (if live mode)
- [ ] Tested with cURL (if live mode)
- [ ] Checked password length (min 8 chars)
- [ ] Checked email format
- [ ] Checked phone field (empty string issue)
- [ ] Verified role value matches enum
- [ ] Checked browser network tab for request details
- [ ] Checked backend logs for error details

## Immediate Action Required

**Switch to code mode and implement these fixes:**

1. ✅ Add console logging to see exact payload
2. ✅ Fix empty phone field issue
3. ✅ Add frontend validation
4. ✅ Test in mock mode first
5. ✅ Document findings

**Command to switch:**
```
switch to code mode to implement debugging and fixes
```
