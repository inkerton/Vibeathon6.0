# Authentication & Authorization Flow

## Overview

The system implements a dual authentication strategy supporting both local email/password authentication with OTP verification and Google OAuth 2.0. Authorization is handled through role-based access control (RBAC) using JWT tokens.

## Authentication Methods

### 1. Local Authentication (Email/Password + OTP)
- User registers with email and password
- OTP sent to email for verification
- User verifies OTP to activate account
- Login with email and password
- JWT token issued upon successful login

### 2. Google OAuth 2.0
- User clicks "Sign in with Google"
- Redirected to Google consent screen
- Google returns user profile
- Account created/linked automatically
- JWT token issued

## Registration Flow (Local)

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. POST /api/v1/auth/register
     │    { email, password, name, phone, role }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 2. Validate input
       │ 3. Check if email exists
       │ 4. Hash password (bcrypt)
       │ 5. Generate 6-digit OTP
       │ 6. Set OTP expiry (10 minutes)
       │ 7. Create user (is_active: false)
       │ 8. Send OTP email
       │
       ▼
┌─────────────┐
│  Database   │
└──────┬──────┘
       │
       │ User created with:
       │ - password_hash
       │ - otp_code
       │ - otp_expires_at
       │ - is_active: false
       │
       ▼
┌─────────┐
│ Client  │ ← Response: { userId, email, message: "OTP sent" }
└────┬────┘
     │
     │ 9. User enters OTP
     │ 10. POST /api/v1/auth/verify-otp
     │     { email, otp }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 11. Find user by email
       │ 12. Verify OTP matches
       │ 13. Check OTP not expired
       │ 14. Set is_active: true
       │ 15. Clear OTP fields
       │ 16. Generate JWT token
       │
       ▼
┌─────────┐
│ Client  │ ← Response: { token, user }
└─────────┘
     │
     │ 17. Store token in localStorage
     │ 18. Redirect to role-specific dashboard
     │
```

### Registration Implementation

**Backend (auth.service.ts)**:
```typescript
async register(data: RegisterDTO) {
  // 1. Validate input
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // 2. Hash password
  const password_hash = await bcrypt.hash(data.password, 10);
  
  // 3. Generate OTP
  const otp_code = generateOTP(); // 6-digit random number
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  
  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password_hash,
      auth_provider: 'local',
      role: data.role || 'customer',
      is_active: false,
      otp_code,
      otp_expires_at
    }
  });
  
  // 5. Send OTP email
  await sendOTPEmail(user.email, otp_code);
  
  return { userId: user.id, email: user.email };
}
```

**Frontend (register page)**:
```typescript
const handleRegister = async (formData) => {
  try {
    const response = await apiClient.post('/auth/register', formData);
    
    // Show OTP input form
    setShowOTPForm(true);
    setUserId(response.data.userId);
    
    toast.success('OTP sent to your email');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Registration failed');
  }
};
```

## OTP Verification Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/verify-otp
     │ { email, otp }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 1. Find user by email
       │ 2. Check user exists
       │ 3. Verify OTP matches
       │ 4. Check OTP not expired
       │
       ├─── Invalid OTP ───┐
       │                   │
       │                   ▼
       │            Return 400 Error
       │
       │ 5. Update user:
       │    - is_active: true
       │    - otp_code: null
       │    - otp_expires_at: null
       │
       │ 6. Generate JWT token
       │    Payload: { id, email, role }
       │    Secret: JWT_SECRET
       │    Expiry: 24h
       │
       ▼
┌─────────┐
│ Client  │ ← Response: { token, user }
└────┬────┘
     │
     │ 7. Store token in localStorage
     │ 8. Set auth context
     │ 9. Redirect based on role
     │
```

## Login Flow (Local)

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/login
     │ { email, password }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 1. Find user by email
       │ 2. Check user exists
       │ 3. Check is_active: true
       │ 4. Compare password with hash
       │
       ├─── Invalid credentials ───┐
       │                            │
       │                            ▼
       │                     Return 401 Error
       │
       │ 5. Generate JWT token
       │    Payload: { id, email, role }
       │
       ▼
┌─────────┐
│ Client  │ ← Response: { token, user }
└────┬────┘
     │
     │ 6. Store token in localStorage
     │ 7. Set auth context
     │ 8. Redirect to role dashboard
     │
```

### Login Implementation

**Backend (auth.service.ts)**:
```typescript
async login(email: string, password: string) {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // 2. Check if active
  if (!user.is_active) {
    throw new Error('Account not verified. Please verify your email.');
  }
  
  // 3. Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // 4. Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}
```

## Google OAuth Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. Click "Sign in with Google"
     │ 2. GET /api/v1/auth/google
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 3. Redirect to Google OAuth
       │    with client_id and scopes
       │
       ▼
┌─────────────┐
│   Google    │
└──────┬──────┘
       │
       │ 4. User grants permission
       │ 5. Redirect to callback URL
       │    with authorization code
       │
       ▼
┌─────────────┐
│   Backend   │ GET /api/v1/auth/google/callback
└──────┬──────┘
       │
       │ 6. Exchange code for tokens
       │ 7. Get user profile from Google
       │ 8. Check if user exists (by email)
       │
       ├─── User exists ───┬─── New user ───┐
       │                   │                 │
       │ 9a. Update user   │ 9b. Create user │
       │     profile       │     with Google │
       │                   │     profile     │
       │                   │                 │
       └───────────────────┴─────────────────┘
                           │
                           │ 10. Generate JWT token
                           │
                           ▼
                    ┌─────────┐
                    │ Client  │ ← Redirect with token
                    └────┬────┘
                         │
                         │ 11. Extract token from URL
                         │ 12. Store in localStorage
                         │ 13. Redirect to dashboard
                         │
```

### OAuth Implementation

**Backend (passport.ts)**:
```typescript
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value }
        });
        
        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails[0].value,
              auth_provider: 'google',
              role: 'customer',
              is_active: true // Auto-activate OAuth users
            }
          });
        }
        
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
```

**Backend (auth.controller.ts)**:
```typescript
async googleAuthCallback(req, res) {
  const user = req.user;
  
  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/auth/google?token=${token}`);
}
```

**Frontend (OAuth callback page)**:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (token) {
    localStorage.setItem('token', token);
    
    // Fetch user data
    apiClient.get('/auth/me').then(response => {
      setUser(response.data.user);
      
      // Redirect based on role
      const redirectPath = getHomePathForRole(response.data.user.role);
      router.push(redirectPath);
    });
  }
}, []);
```

## JWT Token Structure

### Token Payload
```json
{
  "id": "clx123abc",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Token Generation
```typescript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Token Verification
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { id, email, role, iat, exp }
```

## Authorization Flow

### Request Authorization

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ GET /api/v1/orders
     │ Headers: { Authorization: "Bearer <token>" }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ Auth Middleware
       │ 1. Extract token from header
       │ 2. Verify token signature
       │ 3. Check token not expired
       │
       ├─── Invalid token ───┐
       │                     │
       │                     ▼
       │              Return 401 Error
       │
       │ 4. Decode token payload
       │ 5. Attach user to request
       │    req.user = { id, email, role }
       │
       ▼
┌─────────────┐
│   Route     │
│  Handler    │
└──────┬──────┘
       │
       │ Role Middleware (if required)
       │ 1. Check req.user.role
       │ 2. Verify role has permission
       │
       ├─── Insufficient permission ───┐
       │                                │
       │                                ▼
       │                         Return 403 Error
       │
       │ 3. Execute route handler
       │ 4. Return response
       │
       ▼
┌─────────┐
│ Client  │ ← Response with data
└─────────┘
```

### Middleware Implementation

**Auth Middleware (auth.middleware.ts)**:
```typescript
export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Role Middleware (auth.middleware.ts)**:
```typescript
export const roleMiddleware = (allowedRoles: Role[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};
```

**Admin Only Middleware**:
```typescript
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  next();
};
```

### Route Protection Examples

```typescript
// Public route - no auth required
router.get('/menu', menuController.getAllMenuItems);

// Protected route - auth required
router.get('/orders/my-orders', 
  authMiddleware, 
  orderController.getCustomerOrders
);

// Role-specific route
router.get('/orders/active',
  authMiddleware,
  roleMiddleware(['kitchen', 'reception', 'admin']),
  orderController.getActiveOrders
);

// Admin only route
router.post('/staff',
  authMiddleware,
  adminOnly,
  staffController.createStaff
);
```

## Frontend Authorization

### Auth Context

```typescript
// lib/auth-context.tsx
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    
    if (token) {
      // Fetch current user
      apiClient.get('/auth/me')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Routes

```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, isLoading]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
```

### API Client Interceptor

```typescript
// lib/api-client.ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
Admin
  ├─ Full system access
  ├─ Manage all users
  ├─ Manage menu items
  ├─ Manage inventory
  ├─ View all orders
  └─ System configuration

Kitchen Staff
  ├─ View active orders
  ├─ Update order status
  ├─ Manage inventory (reserve/deduct)
  └─ Toggle menu availability

Reception Staff
  ├─ Manage reservations
  ├─ View all orders
  ├─ Update payment status
  └─ Manage waitlist

Inventory Staff
  ├─ Manage inventory items
  ├─ Restock items
  ├─ View transactions
  ├─ Manage recipes
  └─ Update menu availability

Customer
  ├─ Browse menu
  ├─ Place orders
  ├─ Track orders
  ├─ Make reservations
  └─ View order history
```

### Permission Matrix

| Resource | Customer | Kitchen | Reception | Inventory | Admin |
|----------|----------|---------|-----------|-----------|-------|
| Menu (Read) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Menu (Write) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Orders (Own) | ✓ | ✗ | ✗ | ✗ | ✓ |
| Orders (All) | ✗ | ✓ | ✓ | ✗ | ✓ |
| Order Status | ✗ | ✓ | ✓ | ✗ | ✓ |
| Reservations (Own) | ✓ | ✗ | ✗ | ✗ | ✓ |
| Reservations (All) | ✗ | ✗ | ✓ | ✗ | ✓ |
| Inventory | ✗ | Partial | ✗ | ✓ | ✓ |
| Recipes | ✗ | ✗ | ✗ | ✓ | ✓ |
| Staff | ✗ | ✗ | ✗ | ✗ | ✓ |

## Security Best Practices

### 1. Password Security
- Minimum 8 characters
- Hashed with bcrypt (10 rounds)
- Never stored in plain text
- Never returned in API responses

### 2. Token Security
- Signed with strong secret
- Short expiration (24h)
- Stored in localStorage (httpOnly cookies recommended)
- Validated on every request

### 3. OTP Security
- 6-digit random number
- 10-minute expiration
- Single use only
- Cleared after verification

### 4. API Security
- HTTPS only in production
- CORS configuration
- Rate limiting (planned)
- Input validation
- SQL injection prevention (Prisma)

### 5. Session Management
- Token refresh mechanism (planned)
- Logout clears all tokens
- Concurrent session handling

## Error Handling

### Authentication Errors

| Error | Status | Description |
|-------|--------|-------------|
| No token provided | 401 | Missing Authorization header |
| Invalid token | 401 | Token signature invalid |
| Token expired | 401 | Token past expiration |
| Invalid credentials | 401 | Wrong email/password |
| Account not verified | 401 | OTP not verified |
| Insufficient permissions | 403 | Role lacks permission |
| Email already exists | 409 | Duplicate registration |
| Invalid OTP | 400 | Wrong or expired OTP |

### Error Response Format

```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

## Token Refresh Flow (Planned)

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ API Request with expired token
     ▼
┌─────────────┐
│   Backend   │ ← 401 Token Expired
└──────┬──────┘
       │
       ▼
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/refresh
     │ { refreshToken }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 1. Verify refresh token
       │ 2. Generate new access token
       │ 3. Generate new refresh token
       │
       ▼
┌─────────┐
│ Client  │ ← { accessToken, refreshToken }
└────┬────┘
     │
     │ 4. Store new tokens
     │ 5. Retry original request
     │
```

## Logout Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/logout
     │ Headers: { Authorization: "Bearer <token>" }
     ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 1. Verify token (optional)
       │ 2. Add token to blacklist (planned)
       │ 3. Return success
       │
       ▼
┌─────────┐
│ Client  │ ← Success response
└────┬────┘
     │
     │ 4. Remove token from localStorage
     │ 5. Clear auth context
     │ 6. Redirect to login page
     │
```

## Testing Authentication

### Unit Tests
- Password hashing
- OTP generation
- JWT signing/verification
- Token expiration

### Integration Tests
- Registration flow
- Login flow
- OAuth flow
- Protected route access
- Role-based authorization

### Security Tests
- SQL injection attempts
- XSS attempts
- CSRF protection
- Brute force protection
- Token tampering

## Troubleshooting

### Common Issues

**Issue**: "Token expired"
- **Solution**: Implement token refresh or re-login

**Issue**: "Invalid credentials"
- **Solution**: Verify email/password, check account is active

**Issue**: "OTP expired"
- **Solution**: Request new OTP via resend endpoint

**Issue**: "Insufficient permissions"
- **Solution**: Verify user has correct role for the operation

**Issue**: "CORS error"
- **Solution**: Add frontend URL to CORS whitelist

**Issue**: "OAuth callback fails"
- **Solution**: Verify Google OAuth credentials and callback URL
