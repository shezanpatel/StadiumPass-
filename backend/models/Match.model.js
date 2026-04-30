const mongoose = require('mongoose');

/**
 * IMatch Interface:
 * { teams: [string, string], tournament: TournamentType, venue: ObjectId,
 *   dateTime: Date, status: MatchStatus, weather: IWeather,
 *   starPlayers: IStarPlayer[], ticketPricing: ITicketPricing,
 *   seatAvailability: ISeatAvailability, score: IScore }
 */

const weatherSchema = new mongoose.Schema({
  condition: { type: String, default: 'Clear' },
  temperature: { type: Number },
  humidity: { type: Number },
  windSpeed: { type: Number },
  icon: { type: String, default: '☀️' }
}, { _id: false });

const starPlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'allrounder', 'wicketkeeper'],
    required: true
  },
  country: { type: String },
  imageUrl: { type: String, default: '' },
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    average: { type: Number, default: 0 }
  }
}, { _id: false });

const ticketPricingSchema = new mongoose.Schema({
  general: { type: Number, required: true, min: 0 },
  premium: { type: Number, required: true, min: 0 },
  vip: { type: Number, required: true, min: 0 },
  corporate: { type: Number, required: true, min: 0 },
  dynamicMultiplier: { type: Number, default: 1.0, min: 1.0, max: 5.0 }
}, { _id: false });

const scoreSchema = new mongoose.Schema({
  team1: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 }
  },
  team2: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 }
  },
  currentInnings: { type: Number, default: 1 },
  result: { type: String, default: '' }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  team1: { type: String, required: true, trim: true },
  team2: { type: String, required: true, trim: true },
  team1Logo: { type: String, default: '' },
  team2Logo: { type: String, default: '' },
  tournament: {
    type: String,
    enum: ['IPL', 'World Cup', 'T20I', 'ODI', 'Test', 'Asia Cup', 'Champions Trophy', 'BBL'],
    required: true
  },
  matchNumber: { type: Number },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true },
  dateTime: { type: Date, required: true },
  gates: { type: String, default: '2 Hours Before Match' },
  duration: { type: Number, default: 420 }, // minutes
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'upcoming'
  },
  weather: weatherSchema,
  starPlayers: [starPlayerSchema],
  ticketPricing: { type: ticketPricingSchema, required: true },
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  score: scoreSchema,
  highlights: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  thumbnail: { type: String, default: '' }
}, { timestamps: true });

// Dynamic pricing middleware: Increase price as seats fill
matchSchema.pre('save', function(next) {
  if (this.isModified('bookedSeats') && this.totalSeats > 0) {
    const fillRatio = this.bookedSeats / this.totalSeats;
    if (fillRatio >= 0.9) this.ticketPricing.dynamicMultiplier = 2.5;
    else if (fillRatio >= 0.75) this.ticketPricing.dynamicMultiplier = 2.0;
    else if (fillRatio >= 0.5) this.ticketPricing.dynamicMultiplier = 1.5;
    else if (fillRatio >= 0.25) this.ticketPricing.dynamicMultiplier = 1.25;
    else this.ticketPricing.dynamicMultiplier = 1.0;
  }
  next();
});

// Virtual: availability percentage
matchSchema.virtual('availabilityPercent').get(function() {
  if (!this.totalSeats) return 100;
  return Math.round(((this.totalSeats - this.bookedSeats) / this.totalSeats) * 100);
});

module.exports = mongoose.model('Match', matchSchema);
