// ============================================================
// StadiumPass TypeScript Interfaces — No `any` types allowed
// ============================================================

export type UserRole = 'client' | 'admin';
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled' | 'postponed';
export type SeatStatus = 'available' | 'selected' | 'booked' | 'locked' | 'vip';
export type SeatTier = 'general' | 'premium' | 'vip' | 'corporate';
export type SectionType = 'north' | 'south' | 'east' | 'west';
export type TournamentType = 'IPL' | 'World Cup' | 'T20I' | 'ODI' | 'Test' | 'Asia Cup' | 'Champions Trophy' | 'BBL';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'upi' | 'wallet' | 'net_banking';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refund_requested' | 'refunded';
export type RefundStatus = 'none' | 'requested' | 'approved' | 'rejected' | 'processed';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  favoriteTeams: string[];
  walletBalance: number;
  bookings: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWeather {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface IStarPlayer {
  name: string;
  team: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  country: string;
  imageUrl: string;
  stats: { matches: number; runs: number; wickets: number; average: number };
}

export interface ITicketPricing {
  general: number;
  premium: number;
  vip: number;
  corporate: number;
  dynamicMultiplier: number;
}

export interface IScore {
  team1: { runs: number; wickets: number; overs: number };
  team2: { runs: number; wickets: number; overs: number };
  currentInnings: number;
  result: string;
}

export interface IMatch {
  _id: string;
  title: string;
  team1: string;
  team2: string;
  team1Logo: string;
  team2Logo: string;
  tournament: TournamentType;
  matchNumber?: number;
  venue: IStadium | string;
  dateTime: string;
  gates: string;
  status: MatchStatus;
  weather: IWeather;
  starPlayers: IStarPlayer[];
  ticketPricing: ITicketPricing;
  totalSeats: number;
  bookedSeats: number;
  score: IScore;
  isFeatured: boolean;
  thumbnail: string;
  createdAt: string;
}

export interface ISeat {
  seatId: string;
  row: string;
  number: number;
  section: SectionType;
  tier: SeatTier;
  basePrice: number;
  svgX?: number;
  svgY?: number;
  angle?: number;
  status?: SeatStatus; // Runtime status (not stored in DB per seat)
}

export interface ISection {
  name: SectionType;
  displayName: string;
  startAngle: number;
  endAngle: number;
  color: string;
  totalRows: number;
  seatsPerRow: number;
  seats: ISeat[];
}

export interface IStadium {
  _id: string;
  name: string;
  shortCode: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  pitchType: string;
  sections: ISection[];
  amenities: string[];
  images: string[];
  thumbnail: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface IBookedSeat {
  seatId: string;
  section: string;
  row: string;
  number: number;
  tier: SeatTier;
  price: number;
}

export interface IPayment {
  method: PaymentMethod;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  maskedPaymentInfo: string;
  paidAt?: string;
}

export interface IRefund {
  requestedAt?: string;
  processedAt?: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  refundTransactionId?: string;
  adminNote?: string;
}

export interface IETicket {
  qrCode: string;
  issuedAt: string;
  isScanned: boolean;
  scannedAt?: string;
}

export interface IBooking {
  _id: string;
  bookingRef: string;
  user: IUser | string;
  match: IMatch | string;
  seats: IBookedSeat[];
  payment: IPayment;
  subtotal: number;
  convenienceFee: number;
  taxes: number;
  totalAmount: number;
  status: BookingStatus;
  refund: IRefund;
  eTicket: IETicket;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// UI-specific interfaces
export interface ISeatMapSeat extends ISeat {
  status: SeatStatus;
  cx: number; // SVG center X
  cy: number; // SVG center Y
  price: number; // Calculated with dynamic multiplier
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  data: { token: string; user: IUser };
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ILoginForm {
  email: string;
  password: string;
  role: UserRole;
}

export interface IRegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: UserRole;
  adminCode?: string;
}

export interface ICheckoutForm {
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  upiId?: string;
}
