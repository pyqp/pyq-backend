# PYQPB Backend — Architecture

## Overview

REST API built with **Node.js + TypeScript + Express + MongoDB + Redis**.

```
Client (Next.js) ──► Nginx ──► Express API ──► MongoDB
                                    │
                                    ├──► Redis (cache + rate limiting)
                                    ├──► Cloudinary (file storage)
                                    └──► Razorpay (payments)
```

---

## Directory Structure

```
src/
├── app.ts                    # Express app setup (middleware, routes)
├── server.ts                 # HTTP server entry point
├── constants.ts              # App-wide constants
│
├── config/                   # Third-party service configs
│   ├── database.ts           # MongoDB connection
│   ├── redis.ts              # Redis connection + cache helpers
│   ├── email.ts              # Nodemailer transporter
│   ├── razorpay.ts           # Razorpay SDK init
│   └── cloudinary.config.ts  # Cloudinary SDK init
│
├── models/                   # Mongoose schemas (16 models)
│   ├── User.model.ts         # Users with credits, loyalty, referrals
│   ├── Exam.model.ts         # Exam catalog (UPSC, SSC, Banking…)
│   ├── Package.model.ts      # Credit packages (Starter, Pro, Ultimate)
│   ├── MockTest.model.ts     # Mock tests with sections
│   ├── Question.model.ts     # Question bank (PYQ + mock + practice)
│   ├── TestAttempt.model.ts  # Live test session with per-Q responses
│   ├── Result.model.ts       # Final scores + deep analytics
│   ├── Ranking.model.ts      # Per-test leaderboard
│   ├── Payment.model.ts      # Razorpay payment records
│   ├── CreditTransaction.model.ts  # Full credit ledger (FIFO batches)
│   ├── Referral.model.ts     # Referral tracking
│   ├── Offer.model.ts        # Discount codes
│   ├── UserOfferUsage.model.ts    # Offer usage tracking
│   ├── Notification.model.ts # In-app notifications
│   ├── Refund.model.ts       # Refund requests + processing
│   ├── BlogPost.model.ts     # Blog/content
│   ├── PYQ.model.ts          # Previous year question papers
│   ├── Career.model.ts       # Job openings
│   ├── Contact.model.ts      # Support tickets
│   └── UserResponse.model.ts # Per-question response analytics
│
├── controllers/              # Request handlers (17 controllers)
├── routes/                   # Express routers (17 route files)
├── middleware/               # Express middleware
│   ├── auth.ts               # JWT protect + authorize
│   ├── cache.ts              # Redis route-level cache
│   ├── rateLimiter.ts        # 6 rate limit presets
│   ├── validate.ts           # express-validator error reader
│   ├── errorHandler.ts       # Global error handler
│   ├── upload.middleware.ts  # Multer file upload
│   ├── admin.middleware.ts   # Admin audit log
│   ├── cors.middleware.ts    # Multi-origin CORS
│   └── sanitize.middleware.ts # NoSQL + XSS sanitization
│
├── services/                 # Business logic layer
│   ├── email.service.ts      # Transactional emails (verify, reset, etc.)
│   ├── payment.service.ts    # Razorpay order/verify/refund
│   ├── credit.service.ts     # FIFO credit management
│   ├── ranking.service.ts    # Rank + percentile computation
│   ├── analytics.service.ts  # User + platform analytics
│   ├── notification.service.ts # In-app notification delivery
│   ├── cache.service.ts      # Redis get/set/invalidate helpers
│   ├── upload.service.ts     # Cloudinary image/PDF upload
│   ├── pdf.service.ts        # Score report PDF generation
│   └── sms.service.ts        # SMS (Fast2SMS / Twilio)
│
├── jobs/                     # Scheduled cron tasks
│   ├── creditExpiry.job.ts   # Daily 2 AM — expire stale credit batches
│   ├── rankingUpdate.job.ts  # Every 15 min — recompute test ranks
│   ├── emailReminders.job.ts # Daily 9 AM — credit expiry email warnings
│   ├── statsUpdate.job.ts    # Daily 3 AM — recalculate user stats
│   └── cleanup.job.ts        # Daily 4 AM — close stale attempts, purge old notifications
│
├── validators/               # express-validator chains
├── types/                    # TypeScript type definitions
├── utils/                    # Pure utility functions
│   ├── ApiError.ts           # Operational error class
│   ├── ApiResponse.ts        # Consistent JSON response helpers
│   ├── asyncHandler.ts       # Async error wrapper
│   ├── sendEmail.ts          # Low-level email sender
│   ├── generateToken.ts      # JWT access + refresh token helpers
│   ├── helpers.ts            # Date, OTP, batch ID utilities
│   └── logger.ts             # Winston logger
│
├── database/
│   └── seeds/                # Database seeders
│       ├── index.ts          # Master seed runner
│       ├── exams.seed.ts     # 50 Indian government exams
│       ├── packages.seed.ts  # 3 credit packages
│       ├── mockTests.seed.ts # Sample mock tests
│       ├── pyqs.seed.ts      # PYQ entries
│       ├── blog.seed.ts      # Sample blog posts
│       └── admin.seed.ts     # Admin user
│
└── tests/                    # Jest test suite
    ├── setup.ts              # Global test setup (in-memory MongoDB)
    ├── mocks/                # Test data factories
    ├── *.test.ts             # Unit tests
    └── *.integration.test.ts # Integration tests
```

---

## Data Flow

### Payment Flow
```
POST /payments/create-order
  → Validate package + offer code
  → Calculate discounted amount
  → Create Razorpay order
  → Save Payment (status: created)
  → Return order details to frontend

Frontend → Razorpay Checkout → 

POST /payments/verify
  → Verify HMAC signature
  → Mark Payment success
  → user.addCredits() — FIFO batch
  → CreditTransaction log
  → If first purchase → completeReferralOnPurchase()
  → NotificationService.paymentSuccess()
```

### Credit System (FIFO Batches)
```
Each purchase creates a "batch":
  { creditsReceived: 10, creditsRemaining: 10, expiryDate: +365d }

When a test is started:
  → deductCredits() takes from oldest-expiry batch first
  → CreditTransaction logged as debit

Daily job:
  → Batches past expiryDate → status: 'expired'
  → total credits recomputed
  → User notified at 30-day and 7-day marks
```

### Ranking Pipeline
```
Test submitted → Result saved → 
  Ranking.upsert(user, mockTest, score) →
  rankingUpdate.job (every 15 min) →
  RankingService.recomputeAllRanks() →
  All ranks + percentiles updated in bulk
```

---

## API Auth

All protected routes require:
```
Authorization: Bearer <accessToken>
```

| Role    | Access                            |
|---------|-----------------------------------|
| user    | Own data, tests, results          |
| admin   | All user data, admin panel, seeds |
| partner | Analytics read-only (future)      |

---

## Caching Strategy

| Resource        | TTL     | Invalidated on     |
|----------------|---------|--------------------|
| Exam list       | 5 min   | Exam create/update |
| Exam categories | 1 hour  | Exam create        |
| Package list    | 15 min  | Package update     |
| Mock test list  | 3 min   | Test create        |
| Leaderboard     | 1 min   | Result submitted   |

---

## Environment Variables

See `.env.example` for complete list. Required:

```
MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET,
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
SMTP_HOST, SMTP_USER, SMTP_PASS
```