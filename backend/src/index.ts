import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from './config/passport';
import { errorHandler } from './middleware/error-handler';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
].filter(Boolean); // Remove undefined values

console.log('🌍 Allowed CORS origins:', allowedOrigins);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️  CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import reservationRoutes from './routes/reservation.routes';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';
import recipeRoutes from './routes/recipe.routes';
import staffRoutes from './routes/staff.routes';
const seedRoutes = require('./routes/seed.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/seed', seedRoutes);
// TODO: Add more routes as they are implemented
// app.use('/api/v1/tables', require('./routes/table.routes'));
// app.use('/api/v1/users', require('./routes/user.routes'));
// app.use('/api/v1/notifications', require('./routes/notification.routes'));
// app.use('/api/v1/reviews', require('./routes/review.routes'));
// app.use('/api/v1/waitlist', require('./routes/waitlist.routes'));
// app.use('/api/v1/analytics', require('./routes/analytics.routes'));
// app.use('/api/v1/ai', require('./routes/ai.routes'));

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room based on role
  socket.on('join:role', (role: string) => {
    socket.join(`role:${role}`);
    console.log(`Socket ${socket.id} joined role:${role}`);
  });

  // Join restaurant room
  socket.on('join:restaurant', (restaurantId: string) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant:${restaurantId}`);
  });

  // Join order tracking room
  socket.on('join:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`Socket ${socket.id} joined order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});

export { io };
