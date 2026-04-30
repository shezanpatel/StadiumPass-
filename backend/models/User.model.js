const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * IUser Interface (TypeScript equivalent):
 * {
 *   _id: ObjectId, name: string, email: string, password: string,
 *   role: 'client' | 'admin', phone: string, favoriteTeams: string[],
 *   walletBalance: number, bookings: ObjectId[], isActive: boolean,
 *   createdAt: Date, updatedAt: Date
 * }
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password in queries
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number']
  },
  avatar: { type: String, default: '' },
  favoriteTeams: [{ type: String }],
  walletBalance: { type: Number, default: 0, min: 0 },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastLogin: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
