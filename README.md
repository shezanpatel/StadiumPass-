# 🏏 StadiumPass — Enterprise Cricket Ticket Booking System

A full-stack enterprise-level cricket ticket booking platform with real-time seat selection, dynamic pricing, and a glassmorphism dark UI.

---

## 🏗️ Architecture Overview

```
stadiumpass/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js  # JWT authentication
│   │   ├── booking.controller.js  # Booking + atomic transactions
│   │   └── match.controller.js    # Match CRUD + analytics
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT protect + admin guard
│   ├── models/
│   │   ├── User.model.js       # User schema + bcrypt hashing
│   │   ├── Match.model.js      # Match schema + dynamic pricing
│   │   ├── Booking.model.js    # Booking schema + atomic checks
│   │   └── Stadium.model.js    # Stadium + SVG seat coordinates
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── match.routes.js
│   │   ├── booking.routes.js
│   │   ├── admin.routes.js
│   │   ├── stadium.routes.js
│   │   └── user.routes.js
│   ├── server.js               # Express + Socket.IO server
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # Angular 17 + Tailwind CSS
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── auth/
    │   │   │   │   ├── login/          # Dual-role login
    │   │   │   │   └── register/       # Custom validators
    │   │   │   ├── booking/
    │   │   │   │   ├── dashboard/      # Match listings + filters
    │   │   │   │   ├── match-card/     # Match preview card
    │   │   │   │   ├── match-detail/   # Full match + seat map
    │   │   │   │   ├── stadium-map/    # SVG circular seat map ⭐
    │   │   │   │   ├── checkout/       # Payment + validation
    │   │   │   │   ├── e-ticket/       # Premium ticket UI + QR
    │   │   │   │   └── user-profile/   # Bookings + refund requests
    │   │   │   ├── admin/
    │   │   │   │   ├── admin-dashboard/ # Command center
    │   │   │   │   └── match-form/     # Match CRUD form
    │   │   │   └── shared/
    │   │   │       ├── navbar/
    │   │   │       ├── footer/
    │   │   │       ├── home/           # Landing page
    │   │   │       ├── live-ticker/    # Real-time score bar
    │   │   │       ├── toast/          # Global notifications
    │   │   │       └── skeleton-loader/ # Shimmer placeholders
    │   │   ├── guards/
    │   │   │   ├── auth.guard.ts
    │   │   │   └── admin.guard.ts
    │   │   ├── interceptors/
    │   │   │   ├── auth.interceptor.ts    # Attaches JWT token
    │   │   │   └── error.interceptor.ts   # Global error → toast
    │   │   ├── models/
    │   │   │   └── interfaces.ts          # All TypeScript interfaces
    │   │   └── services/
    │   │       ├── auth.service.ts
    │   │       ├── match.service.ts
    │   │       ├── booking.service.ts
    │   │       ├── toast.service.ts
    │   │       └── socket.service.ts      # WebSocket seat locking
    │   ├── environments/
    │   ├── styles.css                     # Tailwind + skeleton CSS
    │   └── index.html
    ├── tailwind.config.js                 # StadiumPass brand theme
    ├── angular.json
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Angular CLI v17: `npm install -g @angular/cli`

### 1. Backend Setup
```bash
cd stadiumpass/backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
# Server runs on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd stadiumpass/frontend
npm install
ng serve
# App runs on http://localhost:4200
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register client or admin |
| POST | `/api/auth/login` | Login with role check |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Matches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/matches` | Public | List with filters |
| GET | `/api/matches/:id` | Public | Match + booked seats |
| GET | `/api/matches/live-scores` | Public | Live ticker data |
| POST | `/api/matches` | Admin | Create match |
| PUT | `/api/matches/:id` | Admin | Update match |
| DELETE | `/api/matches/:id` | Admin | Cancel match |
| GET | `/api/matches/analytics` | Admin | Revenue data |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Client | Create booking (atomic) |
| GET | `/api/bookings/my` | Client | My booking history |
| GET | `/api/bookings/:id` | Client | Single booking + e-ticket |
| POST | `/api/bookings/:id/refund` | Client | Request refund (24hr rule) |
| PUT | `/api/bookings/:id/process-refund` | Admin | Approve/reject refund |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | All users |
| PUT | `/api/admin/users/:id/toggle-status` | Admin | Ban/unban user |
| GET | `/api/admin/refund-requests` | Admin | Pending refunds |

---

## 🗺️ SVG Circular Stadium Map

The `StadiumMapComponent` generates a fully interactive circular SVG stadium map:

- **4 sections**: North (225°–315°), East (315°–45°), South (45°–135°), West (135°–225°)
- **6 rows** per section, with increasing seats per row outward
- **Seat coordinates** calculated via polar → cartesian: `cx = CX + radius * cos(angle)`
- **Color coding**: Available (Green), Selected (Blue), Booked (Red), VIP (Gold), Locked (Orange)
- **Real-time updates** via WebSocket seat lock/unlock events
- **Max 10 seats** per booking with total price calculation

---

## 💰 Dynamic Pricing Logic

Price multipliers activate as capacity fills:

| Seats Sold | Multiplier |
|-----------|-----------|
| 0–25%    | 1.0× (base) |
| 25–50%   | 1.25× |
| 50–75%   | 1.5× |
| 75–90%   | 2.0× |
| 90%+     | 2.5× |

---

## ♻️ Refund Policy (24-Hour Rule)

```
User requests refund
→ Backend checks: (matchDateTime - now) >= 24 hours?
  → YES: Create refund request, deduct 5% fee, update status to 'refund_requested'
  → NO: Return error with hours remaining and refund deadline
Admin approves/rejects
  → Approved: Credit wallet, free up seats, update status to 'refunded'
  → Rejected: Restore to 'confirmed', store rejection reason
```

---

## 🎨 Design System

| Token | Value | Use |
|-------|-------|-----|
| `sp-navy` | `#0f172a` | Main background |
| `sp-dark` | `#1e293b` | Card background |
| `sp-green` | `#22c55e` | Primary / Cricket Green |
| `sp-gold` | `#eab308` | Accent / VIP / Stadium Gold |
| `sp-blue` | `#3b82f6` | Selected seats |
| `sp-red` | `#ef4444` | Booked seats / Errors |

---

## 🔒 Security Features

- **JWT Authentication** with 7-day expiry
- **bcrypt** password hashing (12 rounds)
- **Helmet.js** security headers
- **Rate limiting**: 100 req/15min globally, 10 req/15min on auth
- **Mongoose atomic transactions** to prevent double-booking
- **Input validation** via express-validator + Angular Reactive Forms
- **Admin code** required for admin registration

---

## 📦 Admin Registration

To register as admin, use the code set in your `.env`:
```
ADMIN_REGISTRATION_CODE=STADIUMPASS_ADMIN_2024
```

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Tailwind CSS, Angular Material |
| State | RxJS BehaviorSubject, Services |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Real-time | Socket.IO (WebSocket) |
| Validation | express-validator, Angular Reactive Forms |
| PDF/QR | qrcode library |
| Security | Helmet, CORS, Rate Limiting |
