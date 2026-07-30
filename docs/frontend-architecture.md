# Frontend Architecture Documentation

## Overview

The frontend is built with Next.js 16.2.11 (App Router) and React 19.2.4, providing a modern, type-safe, and performant user interface for the restaurant management system.

## Technology Stack

### Core Framework
- **Next.js 16.2.11**: React framework with App Router
- **React 19.2.4**: UI library
- **TypeScript 5**: Type safety

### Styling & UI
- **Tailwind CSS 4**: Utility-first CSS framework
- **Material-UI 9.2.0**: Component library
- **shadcn/ui**: Customizable component collection
- **Framer Motion 12.42.2**: Animation library
- **Lucide React**: Icon library

### State Management & Data Fetching
- **TanStack React Query 5.101.4**: Server state management
- **React Hook Form 7.83.0**: Form state management
- **Context API**: Global auth state

### HTTP & Real-time
- **Axios 1.18.1**: HTTP client
- **Socket.io-client 4.8.3**: WebSocket client
- **Axios Mock Adapter**: Mock API for development

### Utilities
- **dayjs**: Date manipulation
- **clsx & tailwind-merge**: Class name utilities
- **class-variance-authority**: Component variants

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   │
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── google/              # OAuth callback
│   │
│   ├── admin/                   # Admin dashboard
│   │   ├── layout.tsx           # Admin layout
│   │   ├── page.tsx             # Dashboard
│   │   ├── staff/               # Staff management
│   │   ├── menu/                # Menu management
│   │   ├── inventory/           # Inventory management
│   │   └── recipes/             # Recipe management
│   │
│   ├── customer/                # Customer interface
│   │   ├── layout.tsx           # Customer layout
│   │   ├── menu/                # Browse menu
│   │   ├── orders/              # Order history & tracking
│   │   ├── checkout/            # Order checkout
│   │   └── reservations/        # Make reservations
│   │
│   ├── kitchen/                 # Kitchen staff interface
│   │   ├── layout.tsx           # Kitchen layout
│   │   └── page.tsx             # Active orders view
│   │
│   ├── reception/               # Reception interface
│   │   ├── layout.tsx           # Reception layout
│   │   ├── page.tsx             # Dashboard
│   │   └── reservations/        # Manage reservations
│   │
│   └── inventory/               # Inventory staff interface
│       ├── layout.tsx           # Inventory layout
│       ├── page.tsx             # Inventory dashboard
│       └── transactions/        # Transaction history
│
├── components/                  # Reusable components
│   ├── Navbar.tsx              # Main navigation
│   ├── MobileMenu.tsx          # Mobile navigation
│   ├── UserProfileDropdown.tsx # User menu
│   ├── Button.tsx              # Custom button
│   ├── Card.tsx                # Card component
│   ├── Modal.tsx               # Modal dialog
│   ├── Toast.tsx               # Toast notifications
│   ├── LoadingSpinner.tsx      # Loading indicator
│   ├── ErrorMessage.tsx        # Error display
│   ├── OrderItemCard.tsx       # Order item display
│   ├── OrderStatusBadge.tsx    # Status badge
│   ├── OrderTimeline.tsx       # Order progress
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ...
│
├── lib/                        # Utilities and configurations
│   ├── api-client.ts           # Axios instance & interceptors
│   ├── mock-api-client.ts      # Mock API implementation
│   ├── mock-state.ts           # Mock data state management
│   ├── socket-client.ts        # Socket.io client setup
│   ├── auth-context.tsx        # Authentication context
│   ├── navigation-config.ts    # Navigation configuration
│   ├── utils.ts                # Utility functions
│   └── mock-data/              # Mock data for development
│
├── public/                     # Static assets
│   ├── images/
│   └── icons/
│
└── node_modules/               # Dependencies
```

## Routing Architecture

### App Router Structure

The application uses Next.js App Router with role-based routing:

```
/                           → Landing page (public)
/auth/login                 → Login page (public)
/auth/register              → Registration page (public)
/auth/google/callback       → OAuth callback (public)

/admin/*                    → Admin routes (admin only)
/kitchen/*                  → Kitchen routes (kitchen staff only)
/reception/*                → Reception routes (reception staff only)
/inventory/*                → Inventory routes (inventory staff only)
/customer/*                 → Customer routes (authenticated customers)
```

### Route Protection

Each role-specific section has its own layout that enforces authentication and authorization:

```typescript
// Example: app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user || user.role !== 'admin') {
    redirect('/auth/login');
  }
  
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
```

## State Management

### 1. Authentication State (Context API)

**Location**: `lib/auth-context.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}
```

**Usage**:
```typescript
const { user, login, logout } = useAuth();
```

### 2. Server State (React Query)

**Purpose**: Manage server data with caching, refetching, and optimistic updates

**Common Queries**:
```typescript
// Fetch menu items
const { data: menuItems } = useQuery({
  queryKey: ['menu'],
  queryFn: () => apiClient.get('/menu').then(res => res.data)
});

// Fetch orders
const { data: orders } = useQuery({
  queryKey: ['orders', 'active'],
  queryFn: () => apiClient.get('/orders/active').then(res => res.data)
});
```

**Common Mutations**:
```typescript
// Create order
const createOrderMutation = useMutation({
  mutationFn: (orderData) => apiClient.post('/orders', orderData),
  onSuccess: () => {
    queryClient.invalidateQueries(['orders']);
    toast.success('Order placed successfully');
  }
});
```

### 3. Form State (React Hook Form)

**Purpose**: Manage complex form state with validation

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: {
    name: '',
    email: '',
    password: ''
  }
});
```

### 4. Local UI State (useState/useReducer)

**Purpose**: Component-specific state (modals, dropdowns, etc.)

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
```

## API Integration

### API Client Configuration

**Location**: `lib/api-client.ts`

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

### Mock API Mode

**Purpose**: Frontend development without backend

**Activation**: Set `NEXT_PUBLIC_API_MODE=mock`

**Features**:
- In-memory state management
- Simulated API delays
- Full CRUD operations
- Realistic data structures

**Location**: `lib/mock-api-client.ts`

```typescript
// Mock API automatically intercepts requests
if (API_MODE === 'mock') {
  apiClient = mockApiClient;
}
```

## Real-time Communication

### Socket.io Integration

**Location**: `lib/socket-client.ts`

```typescript
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true
});

// Connect on auth
socket.connect();

// Join role-specific room
socket.emit('join:role', user.role);

// Listen for events
socket.on('order:new', (order) => {
  // Update UI
  queryClient.invalidateQueries(['orders']);
  toast.info('New order received');
});
```

### Real-time Events

**Kitchen Staff**:
- `order:new` - New order notification
- `order:status` - Order status updates

**Customers**:
- `order:status` - Track order progress
- `reservation:update` - Reservation updates

**Inventory Staff**:
- `inventory:low-stock` - Low stock alerts

**All Roles**:
- `notification:new` - General notifications

## Component Architecture

### Component Hierarchy

```
App
├── RootLayout
│   ├── AuthProvider
│   ├── QueryClientProvider
│   └── SocketProvider
│
├── Public Pages
│   ├── LandingPage
│   ├── LoginPage
│   └── RegisterPage
│
└── Protected Pages
    ├── AdminLayout
    │   ├── Navbar
    │   ├── Sidebar
    │   └── AdminPages
    │
    ├── CustomerLayout
    │   ├── Navbar
    │   └── CustomerPages
    │
    ├── KitchenLayout
    │   └── KitchenPages
    │
    ├── ReceptionLayout
    │   └── ReceptionPages
    │
    └── InventoryLayout
        └── InventoryPages
```

### Component Patterns

#### 1. Container/Presenter Pattern

**Container** (Smart Component):
```typescript
// Handles data fetching and business logic
function MenuContainer() {
  const { data, isLoading } = useQuery(['menu'], fetchMenu);
  const mutation = useMutation(createMenuItem);
  
  return <MenuPresenter 
    items={data} 
    isLoading={isLoading}
    onCreateItem={mutation.mutate}
  />;
}
```

**Presenter** (Dumb Component):
```typescript
// Pure UI component
function MenuPresenter({ items, isLoading, onCreateItem }) {
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {items.map(item => <MenuItem key={item.id} {...item} />)}
      <Button onClick={onCreateItem}>Add Item</Button>
    </div>
  );
}
```

#### 2. Compound Components

```typescript
// Card with subcomponents
<Card>
  <Card.Header>
    <Card.Title>Menu Item</Card.Title>
  </Card.Header>
  <Card.Content>
    <Card.Description>Description here</Card.Description>
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

#### 3. Render Props

```typescript
<DataFetcher
  url="/api/menu"
  render={({ data, isLoading }) => (
    isLoading ? <Spinner /> : <MenuList items={data} />
  )}
/>
```

## Navigation System

### Navigation Configuration

**Location**: `lib/navigation-config.ts`

```typescript
interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  description?: string;
}

// Role-based navigation items
export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'dashboard-icon',
    roles: ['admin']
  },
  // ... more items
];

// Get navigation for specific role
export function getNavigationForRole(role: Role): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(role));
}
```

### Dynamic Navigation

```typescript
function Navbar() {
  const { user } = useAuth();
  const navItems = getNavigationForRole(user.role);
  
  return (
    <nav>
      {navItems.map(item => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
```

## Styling System

### Tailwind CSS Configuration

**Utility-first approach** with custom theme:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      },
      spacing: {...},
      borderRadius: {...}
    }
  }
}
```

### Component Variants (CVA)

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700'
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);
```

### Material-UI Integration

Used for complex components like data tables:

```typescript
import { MaterialReactTable } from 'material-react-table';

<MaterialReactTable
  columns={columns}
  data={data}
  enableSorting
  enableFiltering
  enablePagination
/>
```

## Performance Optimization

### 1. Code Splitting

```typescript
// Dynamic imports for heavy components
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <LoadingSpinner />
});
```

### 2. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/menu-item.jpg"
  alt="Menu Item"
  width={300}
  height={200}
  loading="lazy"
/>
```

### 3. React Query Caching

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});
```

### 4. Memoization

```typescript
const MemoizedComponent = React.memo(ExpensiveComponent);

const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
try {
  const response = await apiClient.post('/orders', orderData);
  toast.success('Order placed successfully');
} catch (error) {
  if (error.response?.status === 400) {
    toast.error(error.response.data.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

## Testing Strategy

### Unit Tests
- Component rendering
- Utility functions
- Custom hooks

### Integration Tests
- User flows
- API integration
- Form submissions

### E2E Tests
- Critical user journeys
- Multi-step processes
- Cross-browser compatibility

## Accessibility

### ARIA Labels
```typescript
<button aria-label="Close modal" onClick={onClose}>
  <X />
</button>
```

### Keyboard Navigation
- Tab order management
- Focus management
- Keyboard shortcuts

### Screen Reader Support
- Semantic HTML
- ARIA roles and properties
- Alt text for images

## Build & Deployment

### Development
```bash
npm run dev          # Start dev server (live API)
npm run dev:mock     # Start dev server (mock API)
```

### Production Build
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_API_MODE=live
NEXT_PUBLIC_SOCKET_URL=https://api.example.com
```

## Best Practices

### 1. Component Organization
- One component per file
- Co-locate related files
- Use index files for exports

### 2. Type Safety
- Define interfaces for all props
- Use TypeScript strict mode
- Avoid `any` type

### 3. Performance
- Lazy load heavy components
- Optimize images
- Minimize re-renders
- Use React Query for server state

### 4. Code Quality
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful comments
- Keep components small and focused

### 5. Security
- Sanitize user input
- Validate on client and server
- Store tokens securely
- Implement CSRF protection

## Future Enhancements

1. **Progressive Web App (PWA)**: Offline support, push notifications
2. **Server-Side Rendering (SSR)**: Improved SEO and initial load
3. **Internationalization (i18n)**: Multi-language support
4. **Dark Mode**: Theme switching
5. **Advanced Analytics**: User behavior tracking
6. **A/B Testing**: Feature experimentation
7. **Performance Monitoring**: Real-time performance metrics
8. **Automated Testing**: Comprehensive test coverage
