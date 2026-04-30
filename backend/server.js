require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Route imports
const authRoutes    = require('./routes/auth.routes');
const matchRoutes   = require('./routes/match.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes   = require('./routes/admin.routes');
const stadiumRoutes = require('./routes/stadium.routes');
const userRoutes    = require('./routes/user.routes');

const app    = express();
const server = http.createServer(app);

// Socket.IO setup for real-time seat locking
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — generous limits for local dev
// General API: 2000 requests per 15 min (covers polling, live scores, etc.)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Auth limiter: 50 per 15 min (enough for dev/testing logins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many auth attempts. Please wait a moment.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Attach io to requests
app.use((req, res, next) => { req.io = io; next(); });

// API Routes
app.use('/api/auth',     authRoutes);
app.use('/api/matches',  matchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/users',    userRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// WebSocket: Seat locking management
const lockedSeats = new Map(); // { `${matchId}_${seatId}`: { userId, expiresAt } }

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('lock_seat', ({ matchId, seatId, userId }) => {
    const key = `${matchId}_${seatId}`;
    const existing = lockedSeats.get(key);
    if (existing && existing.userId !== userId && existing.expiresAt > Date.now()) {
      socket.emit('seat_lock_failed', { seatId, reason: 'Seat already locked by another user' });
      return;
    }
    lockedSeats.set(key, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
    io.emit('seat_status_update', { matchId, seatId, status: 'locked', userId });
  });

  socket.on('unlock_seat', ({ matchId, seatId, userId }) => {
    const key = `${matchId}_${seatId}`;
    const existing = lockedSeats.get(key);
    if (existing && existing.userId === userId) {
      lockedSeats.delete(key);
      io.emit('seat_status_update', { matchId, seatId, status: 'available' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Cleanup expired locks every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of lockedSeats.entries()) {
    if (lock.expiresAt <= now) {
      lockedSeats.delete(key);
      const [matchId, seatId] = key.split('_');
      io.emit('seat_status_update', { matchId, seatId, status: 'available' });
    }
  }
}, 60 * 1000);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`StadiumPass server running on port ${PORT}`));
module.exports = { app, io };
