require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User    = require('./models/User.model');
const Stadium = require('./models/Stadium.model');
const Match   = require('./models/Match.model');
const Booking = require('./models/Booking.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stadiumpass';

// ─── Helpers ────────────────────────────────────────────────────────────────
const daysFromNow = (d) => new Date(Date.now() + d * 86400000);
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000);
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

// ─── USERS ───────────────────────────────────────────────────────────────────
const usersData = [
  // Admin
  { name: 'Super Admin',    email: 'admin@stadiumpass.in',   password: 'Admin@1234',   role: 'admin',  walletBalance: 0 },
  // Clients
  { name: 'Rohan Mehta',    email: 'rohan@example.com',      password: 'Fan@12345',    role: 'client', phone: '9876543210', walletBalance: 5000,  favoriteTeams: ['Mumbai Indians', 'India'] },
  { name: 'Priya Sharma',   email: 'priya@example.com',      password: 'Fan@12345',    role: 'client', phone: '9123456789', walletBalance: 12000, favoriteTeams: ['Chennai Super Kings'] },
  { name: 'Arjun Nair',     email: 'arjun@example.com',      password: 'Fan@12345',    role: 'client', phone: '9988776655', walletBalance: 3500,  favoriteTeams: ['Royal Challengers Bangalore'] },
  { name: 'Sneha Patel',    email: 'sneha@example.com',      password: 'Fan@12345',    role: 'client', phone: '9871234560', walletBalance: 8000,  favoriteTeams: ['Gujarat Titans', 'India'] },
  { name: 'Vikram Singh',   email: 'vikram@example.com',     password: 'Fan@12345',    role: 'client', phone: '9765432109', walletBalance: 1500,  favoriteTeams: ['Rajasthan Royals'] },
];

// ─── STADIUMS ─────────────────────────────────────────────────────────────────
const stadiumsData = [
  {
    name: 'Wankhede Stadium', city: 'Mumbai', country: 'India', capacity: 33108,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'Medical Center', 'ATM'],
    images: [],
  },
  {
    name: 'M. A. Chidambaram Stadium', city: 'Chennai', country: 'India', capacity: 50000,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'Wi-Fi'],
    images: [],
  },
  {
    name: 'Narendra Modi Stadium', city: 'Ahmedabad', country: 'India', capacity: 132000,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'Medical Center', 'ATM', 'Wi-Fi', 'Indoor Warm-up'],
    images: [],
  },
  {
    name: 'Eden Gardens', city: 'Kolkata', country: 'India', capacity: 68000,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'Medical Center'],
    images: [],
  },
  {
    name: 'Rajiv Gandhi International Stadium', city: 'Hyderabad', country: 'India', capacity: 55000,
    amenities: ['Parking', 'Food Court', 'VIP Lounge', 'ATM'],
    images: [],
  },
];

// ─── MATCH BUILDER ────────────────────────────────────────────────────────────
function buildMatch({ title, team1, team2, team1Logo, team2Logo, tournament, venueId, dateTime, status, isFeatured, totalSeats, bookedSeats, general, premium, vip, corporate, multiplier, score }) {
  return {
    title, team1, team2,
    team1Logo: team1Logo || '',
    team2Logo: team2Logo || '',
    tournament, venue: venueId, dateTime, status,
    isFeatured: !!isFeatured,
    totalSeats: totalSeats || 33108,
    bookedSeats: bookedSeats || 0,
    ticketPricing: {
      general:   general   || 500,
      premium:   premium   || 1500,
      vip:       vip       || 5000,
      corporate: corporate || 10000,
      dynamicMultiplier: multiplier || 1.0,
    },
    weather: { condition: 'Clear', temperature: 28, humidity: 55, windSpeed: 12, icon: '☀️' },
    score: score || { team1: { runs: 0, wickets: 0, overs: 0 }, team2: { runs: 0, wickets: 0, overs: 0 }, currentInnings: 1, result: '' },
    starPlayers: [],
    gates: '2 Hours Before Match',
    duration: 420,
  };
}

// ─── MAIN SEED ────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Stadium.deleteMany({}),
    Match.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──
  const hashedUsers = await Promise.all(
    usersData.map(async (u) => ({
      ...u,
      password: await bcrypt.hash(u.password, 12),
    }))
  );
  const users = await User.insertMany(hashedUsers);
  console.log(`👤 Created ${users.length} users`);

  const admin  = users[0];
  const rohan  = users[1];
  const priya  = users[2];
  const arjun  = users[3];
  const sneha  = users[4];
  const vikram = users[5];

  // ── Stadiums ──
  const stadiums = await Stadium.insertMany(stadiumsData);
  console.log(`🏟️  Created ${stadiums.length} stadiums`);

  const wankhede  = stadiums[0];
  const chepauk   = stadiums[1];
  const ahmedabad = stadiums[2];
  const eden      = stadiums[3];
  const hyderabad = stadiums[4];

  // ── Matches ──
  const now = new Date();

  const matchesRaw = [
    // ── LIVE (2 matches) ──
    buildMatch({
      title: 'MI vs CSK — IPL Match 18',
      team1: 'Mumbai Indians', team2: 'Chennai Super Kings',
      tournament: 'IPL', venueId: wankhede._id,
      dateTime: hoursFromNow(-2), status: 'live', isFeatured: true,
      totalSeats: 33108, bookedSeats: 29800,
      general: 800, premium: 2500, vip: 8000, corporate: 15000, multiplier: 2.5,
      score: { team1: { runs: 187, wickets: 4, overs: 18.3 }, team2: { runs: 0, wickets: 0, overs: 0 }, currentInnings: 1, result: '' },
    }),
    buildMatch({
      title: 'RCB vs KKR — IPL Match 19',
      team1: 'Royal Challengers Bangalore', team2: 'Kolkata Knight Riders',
      tournament: 'IPL', venueId: eden._id,
      dateTime: hoursFromNow(-1), status: 'live', isFeatured: true,
      totalSeats: 68000, bookedSeats: 61000,
      general: 600, premium: 2000, vip: 7000, corporate: 12000, multiplier: 2.0,
      score: { team1: { runs: 142, wickets: 6, overs: 16.0 }, team2: { runs: 0, wickets: 0, overs: 0 }, currentInnings: 1, result: '' },
    }),

    // ── UPCOMING (8 matches) ──
    buildMatch({
      title: 'GT vs RR — IPL Match 20',
      team1: 'Gujarat Titans', team2: 'Rajasthan Royals',
      tournament: 'IPL', venueId: ahmedabad._id,
      dateTime: daysFromNow(1), status: 'upcoming', isFeatured: true,
      totalSeats: 132000, bookedSeats: 45000,
      general: 500, premium: 1500, vip: 6000, corporate: 12000, multiplier: 1.25,
    }),
    buildMatch({
      title: 'SRH vs PBKS — IPL Match 21',
      team1: 'Sunrisers Hyderabad', team2: 'Punjab Kings',
      tournament: 'IPL', venueId: hyderabad._id,
      dateTime: daysFromNow(2), status: 'upcoming',
      totalSeats: 55000, bookedSeats: 12000,
      general: 500, premium: 1500, vip: 5000, corporate: 10000, multiplier: 1.0,
    }),
    buildMatch({
      title: 'CSK vs RCB — IPL Match 22',
      team1: 'Chennai Super Kings', team2: 'Royal Challengers Bangalore',
      tournament: 'IPL', venueId: chepauk._id,
      dateTime: daysFromNow(3), status: 'upcoming', isFeatured: true,
      totalSeats: 50000, bookedSeats: 38000,
      general: 700, premium: 2000, vip: 7000, corporate: 13000, multiplier: 2.0,
    }),
    buildMatch({
      title: 'India vs Australia — 1st T20I',
      team1: 'India', team2: 'Australia',
      tournament: 'T20I', venueId: wankhede._id,
      dateTime: daysFromNow(5), status: 'upcoming', isFeatured: true,
      totalSeats: 33108, bookedSeats: 28000,
      general: 1000, premium: 3000, vip: 10000, corporate: 20000, multiplier: 2.5,
    }),
    buildMatch({
      title: 'KKR vs MI — IPL Match 23',
      team1: 'Kolkata Knight Riders', team2: 'Mumbai Indians',
      tournament: 'IPL', venueId: eden._id,
      dateTime: daysFromNow(6), status: 'upcoming',
      totalSeats: 68000, bookedSeats: 22000,
      general: 600, premium: 1800, vip: 6500, corporate: 12000, multiplier: 1.25,
    }),
    buildMatch({
      title: 'India vs Australia — 2nd T20I',
      team1: 'India', team2: 'Australia',
      tournament: 'T20I', venueId: eden._id,
      dateTime: daysFromNow(8), status: 'upcoming',
      totalSeats: 68000, bookedSeats: 55000,
      general: 1000, premium: 3000, vip: 10000, corporate: 20000, multiplier: 2.0,
    }),
    buildMatch({
      title: 'RR vs GT — IPL Match 24',
      team1: 'Rajasthan Royals', team2: 'Gujarat Titans',
      tournament: 'IPL', venueId: hyderabad._id,
      dateTime: daysFromNow(10), status: 'upcoming',
      totalSeats: 55000, bookedSeats: 8000,
      general: 500, premium: 1500, vip: 5000, corporate: 10000, multiplier: 1.0,
    }),
    buildMatch({
      title: 'India vs Australia — 3rd T20I',
      team1: 'India', team2: 'Australia',
      tournament: 'T20I', venueId: ahmedabad._id,
      dateTime: daysFromNow(12), status: 'upcoming', isFeatured: true,
      totalSeats: 132000, bookedSeats: 70000,
      general: 1000, premium: 3000, vip: 10000, corporate: 20000, multiplier: 1.5,
    }),

    // ── COMPLETED (6 matches) ──
    buildMatch({
      title: 'MI vs RCB — IPL Match 12',
      team1: 'Mumbai Indians', team2: 'Royal Challengers Bangalore',
      tournament: 'IPL', venueId: wankhede._id,
      dateTime: daysAgo(5), status: 'completed',
      totalSeats: 33108, bookedSeats: 33108,
      general: 800, premium: 2500, vip: 8000, corporate: 15000, multiplier: 2.5,
      score: { team1: { runs: 201, wickets: 6, overs: 20 }, team2: { runs: 187, wickets: 8, overs: 20 }, currentInnings: 2, result: 'Mumbai Indians won by 14 runs' },
    }),
    buildMatch({
      title: 'CSK vs KKR — IPL Match 13',
      team1: 'Chennai Super Kings', team2: 'Kolkata Knight Riders',
      tournament: 'IPL', venueId: chepauk._id,
      dateTime: daysAgo(7), status: 'completed',
      totalSeats: 50000, bookedSeats: 50000,
      general: 700, premium: 2000, vip: 7000, corporate: 13000, multiplier: 2.0,
      score: { team1: { runs: 178, wickets: 5, overs: 20 }, team2: { runs: 181, wickets: 4, overs: 19.2 }, currentInnings: 2, result: 'Kolkata Knight Riders won by 6 wickets' },
    }),
    buildMatch({
      title: 'India vs England — 1st ODI',
      team1: 'India', team2: 'England',
      tournament: 'ODI', venueId: ahmedabad._id,
      dateTime: daysAgo(10), status: 'completed',
      totalSeats: 132000, bookedSeats: 120000,
      general: 1000, premium: 3500, vip: 12000, corporate: 25000, multiplier: 2.5,
      score: { team1: { runs: 320, wickets: 6, overs: 50 }, team2: { runs: 298, wickets: 9, overs: 50 }, currentInnings: 2, result: 'India won by 22 runs' },
    }),
    buildMatch({
      title: 'GT vs SRH — IPL Match 14',
      team1: 'Gujarat Titans', team2: 'Sunrisers Hyderabad',
      tournament: 'IPL', venueId: ahmedabad._id,
      dateTime: daysAgo(12), status: 'completed',
      totalSeats: 132000, bookedSeats: 88000,
      general: 500, premium: 1500, vip: 6000, corporate: 12000, multiplier: 1.5,
      score: { team1: { runs: 165, wickets: 8, overs: 20 }, team2: { runs: 168, wickets: 3, overs: 18.4 }, currentInnings: 2, result: 'Sunrisers Hyderabad won by 7 wickets' },
    }),
    buildMatch({
      title: 'India vs England — 2nd ODI',
      team1: 'India', team2: 'England',
      tournament: 'ODI', venueId: eden._id,
      dateTime: daysAgo(15), status: 'completed',
      totalSeats: 68000, bookedSeats: 68000,
      general: 1000, premium: 3500, vip: 12000, corporate: 25000, multiplier: 2.0,
      score: { team1: { runs: 287, wickets: 10, overs: 49.3 }, team2: { runs: 288, wickets: 5, overs: 47.1 }, currentInnings: 2, result: 'England won by 5 wickets' },
    }),
    buildMatch({
      title: 'RR vs PBKS — IPL Match 10',
      team1: 'Rajasthan Royals', team2: 'Punjab Kings',
      tournament: 'IPL', venueId: hyderabad._id,
      dateTime: daysAgo(18), status: 'completed',
      totalSeats: 55000, bookedSeats: 42000,
      general: 500, premium: 1500, vip: 5000, corporate: 10000, multiplier: 1.0,
      score: { team1: { runs: 195, wickets: 4, overs: 20 }, team2: { runs: 172, wickets: 9, overs: 20 }, currentInnings: 2, result: 'Rajasthan Royals won by 23 runs' },
    }),
  ];

  const matches = await Match.insertMany(matchesRaw);
  console.log(`🏏 Created ${matches.length} matches (2 live, 8 upcoming, 6 completed)`);

  // Map by title for easy lookup
  const byTitle = {};
  matches.forEach(m => byTitle[m.title] = m);

  // ── Bookings ──
  // Helper to build a seat
  const seat = (seatId, section, row, number, tier, price) => ({ seatId, section, row, number, tier, price });

  const bookingsData = [
    // Rohan — upcoming MI vs CSK (live), and a completed match
    {
      user: rohan._id, match: byTitle['MI vs CSK — IPL Match 18']._id,
      bookingRef: `SP-${Date.now()}-R001`,
      seats: [seat('N-A-10', 'north', 'A', 10, 'premium', 2500), seat('N-A-11', 'north', 'A', 11, 'premium', 2500)],
      payment: { method: 'upi', status: 'completed', maskedPaymentInfo: 'rohan@okaxis', paidAt: daysAgo(3) },
      subtotal: 5000, convenienceFee: 100, taxes: 900, totalAmount: 6000,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(3), isScanned: false },
    },
    {
      user: rohan._id, match: byTitle['MI vs RCB — IPL Match 12']._id,
      bookingRef: `SP-${Date.now()}-R002`,
      seats: [seat('S-B-05', 'south', 'B', 5, 'vip', 8000)],
      payment: { method: 'credit_card', status: 'completed', maskedPaymentInfo: '**** **** **** 4242', paidAt: daysAgo(8) },
      subtotal: 8000, convenienceFee: 160, taxes: 1440, totalAmount: 9600,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(8), isScanned: true, scannedAt: daysAgo(5) },
    },

    // Priya — CSK matches
    {
      user: priya._id, match: byTitle['CSK vs RCB — IPL Match 22']._id,
      bookingRef: `SP-${Date.now()}-P001`,
      seats: [seat('N-C-01', 'north', 'C', 1, 'premium', 2000), seat('N-C-02', 'north', 'C', 2, 'premium', 2000), seat('N-C-03', 'north', 'C', 3, 'premium', 2000)],
      payment: { method: 'wallet', status: 'completed', maskedPaymentInfo: 'Wallet', paidAt: daysAgo(1) },
      subtotal: 6000, convenienceFee: 120, taxes: 1080, totalAmount: 7200,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(1), isScanned: false },
    },
    {
      user: priya._id, match: byTitle['CSK vs KKR — IPL Match 13']._id,
      bookingRef: `SP-${Date.now()}-P002`,
      seats: [seat('E-A-22', 'east', 'A', 22, 'vip', 7000), seat('E-A-23', 'east', 'A', 23, 'vip', 7000)],
      payment: { method: 'debit_card', status: 'completed', maskedPaymentInfo: '**** **** **** 1234', paidAt: daysAgo(10) },
      subtotal: 14000, convenienceFee: 280, taxes: 2520, totalAmount: 16800,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(10), isScanned: true, scannedAt: daysAgo(7) },
    },

    // Arjun — RCB match
    {
      user: arjun._id, match: byTitle['RCB vs KKR — IPL Match 19']._id,
      bookingRef: `SP-${Date.now()}-A001`,
      seats: [seat('W-D-14', 'west', 'D', 14, 'general', 600)],
      payment: { method: 'upi', status: 'completed', maskedPaymentInfo: 'arjun@ybl', paidAt: daysAgo(2) },
      subtotal: 600, convenienceFee: 12, taxes: 108, totalAmount: 720,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(2), isScanned: false },
    },
    {
      user: arjun._id, match: byTitle['India vs England — 1st ODI']._id,
      bookingRef: `SP-${Date.now()}-A002`,
      seats: [seat('N-F-08', 'north', 'F', 8, 'corporate', 12000)],
      payment: { method: 'net_banking', status: 'completed', maskedPaymentInfo: 'HDFC Net Banking', paidAt: daysAgo(14) },
      subtotal: 12000, convenienceFee: 240, taxes: 2160, totalAmount: 14400,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(14), isScanned: true, scannedAt: daysAgo(10) },
    },

    // Sneha — India matches
    {
      user: sneha._id, match: byTitle['India vs Australia — 1st T20I']._id,
      bookingRef: `SP-${Date.now()}-S001`,
      seats: [seat('S-A-01', 'south', 'A', 1, 'vip', 10000), seat('S-A-02', 'south', 'A', 2, 'vip', 10000)],
      payment: { method: 'credit_card', status: 'completed', maskedPaymentInfo: '**** **** **** 5678', paidAt: daysAgo(2) },
      subtotal: 20000, convenienceFee: 400, taxes: 3600, totalAmount: 24000,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(2), isScanned: false },
    },
    {
      user: sneha._id, match: byTitle['GT vs SRH — IPL Match 14']._id,
      bookingRef: `SP-${Date.now()}-S002`,
      seats: [seat('E-B-10', 'east', 'B', 10, 'general', 500)],
      payment: { method: 'upi', status: 'completed', maskedPaymentInfo: 'sneha@paytm', paidAt: daysAgo(15) },
      subtotal: 500, convenienceFee: 10, taxes: 90, totalAmount: 600,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(15), isScanned: true, scannedAt: daysAgo(12) },
    },

    // Vikram — refund scenario
    {
      user: vikram._id, match: byTitle['RR vs PBKS — IPL Match 10']._id,
      bookingRef: `SP-${Date.now()}-V001`,
      seats: [seat('W-C-07', 'west', 'C', 7, 'premium', 1500)],
      payment: { method: 'wallet', status: 'refunded', maskedPaymentInfo: 'Wallet', paidAt: daysAgo(22) },
      subtotal: 1500, convenienceFee: 30, taxes: 270, totalAmount: 1800,
      status: 'refunded',
      refund: { requestedAt: daysAgo(20), processedAt: daysAgo(19), amount: 1710, reason: 'Change of plans', status: 'processed', refundTransactionId: `RFD-${Date.now()}`, adminNote: 'Approved' },
      eTicket: { qrCode: '', issuedAt: daysAgo(22), isScanned: false },
    },
    {
      user: vikram._id, match: byTitle['GT vs RR — IPL Match 20']._id,
      bookingRef: `SP-${Date.now()}-V002`,
      seats: [seat('N-E-03', 'north', 'E', 3, 'general', 500)],
      payment: { method: 'upi', status: 'completed', maskedPaymentInfo: 'vikram@sbi', paidAt: daysAgo(1) },
      subtotal: 500, convenienceFee: 10, taxes: 90, totalAmount: 600,
      status: 'confirmed',
      eTicket: { qrCode: '', issuedAt: daysAgo(1), isScanned: false },
    },
  ];

  const bookings = await Booking.insertMany(bookingsData);
  console.log(`🎟️  Created ${bookings.length} bookings`);

  // Link bookings back to users
  for (const booking of bookings) {
    await User.findByIdAndUpdate(booking.user, { $push: { bookings: booking._id } });
  }
  console.log('🔗 Linked bookings to users');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  SEED COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n👤 LOGIN CREDENTIALS\n');
  console.log('  🛡️  ADMIN');
  console.log('     Email   : admin@stadiumpass.in');
  console.log('     Password: Admin@1234');
  console.log('     URL     : http://localhost:4200/admin-login\n');
  console.log('  👥 CLIENTS (all use password: Fan@12345)');
  console.log('     rohan@example.com   — ₹5,000 wallet, 2 bookings');
  console.log('     priya@example.com   — ₹12,000 wallet, 2 bookings');
  console.log('     arjun@example.com   — ₹3,500 wallet, 2 bookings');
  console.log('     sneha@example.com   — ₹8,000 wallet, 2 bookings');
  console.log('     vikram@example.com  — ₹1,500 wallet, 1 refund + 1 upcoming');
  console.log('\n🏏 MATCHES');
  console.log('     2 Live   | 8 Upcoming | 6 Completed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
