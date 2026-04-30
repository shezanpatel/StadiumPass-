const mongoose = require('mongoose');

/**
 * ISeat Interface:
 * { seatId: string, row: string, number: number, section: SectionType,
 *   tier: TierType, basePrice: number, status: SeatStatus, x: number, y: number }
 *
 * IStadium Interface:
 * { name: string, city: string, country: string, capacity: number,
 *   sections: ISection[], amenities: string[], images: string[] }
 */

const seatSchema = new mongoose.Schema({
  seatId: { type: String, required: true }, // e.g. "N-A-12"
  row: { type: String, required: true },
  number: { type: Number, required: true },
  section: {
    type: String,
    enum: ['north', 'south', 'east', 'west'],
    required: true
  },
  tier: {
    type: String,
    enum: ['general', 'premium', 'vip', 'corporate'],
    default: 'general'
  },
  basePrice: { type: Number, required: true, min: 0 },
  svgX: { type: Number }, // SVG coordinate X for circular map
  svgY: { type: Number }, // SVG coordinate Y for circular map
  angle: { type: Number } // Angle in circular layout (0-360)
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  name: { type: String, enum: ['north', 'south', 'east', 'west'], required: true },
  displayName: { type: String, required: true }, // "North Stand", etc.
  startAngle: { type: Number, required: true }, // Degrees for SVG arc
  endAngle: { type: Number, required: true },
  color: { type: String, default: '#22c55e' },
  totalRows: { type: Number, required: true },
  seatsPerRow: { type: Number, required: true },
  seats: [seatSchema]
}, { _id: false });

const stadiumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stadium name is required'],
    trim: true,
    unique: true
  },
  shortCode: { type: String, uppercase: true, maxlength: 5 },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  country: { type: String, default: 'India' },
  capacity: { type: Number, required: true, min: 1000 },
  pitchType: {
    type: String,
    enum: ['flat', 'seaming', 'spinning', 'bouncy'],
    default: 'flat'
  },
  sections: [sectionSchema],
  amenities: [{ type: String }],
  images: [{ type: String }],
  thumbnail: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual: total seats
stadiumSchema.virtual('totalSeats').get(function() {
  return this.sections.reduce((acc, section) =>
    acc + section.seats.length, 0);
});

module.exports = mongoose.model('Stadium', stadiumSchema);
