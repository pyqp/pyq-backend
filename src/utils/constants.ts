// ─── Credit Config ────────────────────────────────────────────────────────────
export const CREDIT_CONFIG = {
  REFERRAL_ON_SIGNUP:    0,
  REFERRAL_ON_PURCHASE:  1,
  MILESTONE_10_BONUS:    3,
  MILESTONE_50_BONUS:    15,
  DEFAULT_VALIDITY_DAYS: 365,
  EXPIRY_WARNING_DAYS:   30,
};

// ─── Loyalty Points ───────────────────────────────────────────────────────────
export const LOYALTY_CONFIG = {
  POINTS_PER_TEST:       5,
  POINTS_PER_PURCHASE:   10,
  POINTS_PER_REFERRAL:   20,
  DAILY_LOGIN_POINTS:    2,
  LEVELS: {
    BRONZE:   { min: 0,    name: 'Bronze',   color: '#CD7F32' },
    SILVER:   { min: 100,  name: 'Silver',   color: '#C0C0C0' },
    GOLD:     { min: 500,  name: 'Gold',     color: '#FFD700' },
    PLATINUM: { min: 1500, name: 'Platinum', color: '#E5E4E2' },
  },
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100,
};

// ─── Cache TTLs (seconds) ─────────────────────────────────────────────────────
export const CACHE_TTL = {
  EXAMS:        300,   // 5 min
  EXAM_DETAIL:  600,   // 10 min
  CATEGORIES:   3600,  // 1 hour
  PACKAGES:     900,   // 15 min
  MOCK_TESTS:   180,   // 3 min
  LEADERBOARD:  60,    // 1 min
  OFFERS:       300,   // 5 min
};

// ─── Rate Limits ──────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  GLOBAL:        { windowMs: 15 * 60 * 1000, max: 100 },
  AUTH:          { windowMs: 15 * 60 * 1000, max: 20  },
  OTP:           { windowMs: 10 * 60 * 1000, max: 5   },
  PAYMENT:       { windowMs: 15 * 60 * 1000, max: 30  },
  TEST_START:    { windowMs: 10 * 60 * 1000, max: 10  },
  CONTACT:       { windowMs: 60 * 60 * 1000, max: 5   },
};

// ─── File Upload ──────────────────────────────────────────────────────────────
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE:      5 * 1024 * 1024, // 5 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES:  ['application/pdf'],
  AVATAR_MAX_SIZE:    2 * 1024 * 1024, // 2 MB
};

// ─── Exam Config ──────────────────────────────────────────────────────────────
export const EXAM_CONFIG = {
  MAX_QUESTIONS_PER_TEST:   200,
  MIN_QUESTIONS_PER_TEST:   5,
  MAX_DURATION_MINUTES:     360,
  BULK_UPLOAD_LIMIT:        500,
  DEFAULT_MARKS_PER_Q:      2,
  DEFAULT_NEGATIVE_MARKS:   0.5,
};

// ─── Email Templates ──────────────────────────────────────────────────────────
export const EMAIL_SUBJECTS = {
  VERIFY_EMAIL:           'Verify your PYQPB account',
  RESET_PASSWORD:         'Reset your PYQPB password',
  PAYMENT_SUCCESS:        'Payment confirmed — credits added!',
  PAYMENT_FAILED:         'Payment failed — please try again',
  REFERRAL_BONUS:         'You earned a referral bonus!',
  TEST_RESULT:            'Your test result is ready',
  CREDIT_EXPIRY_WARNING:  'Your credits are expiring soon',
  WELCOME:                'Welcome to PYQPB!',
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  USER:    'user',
  ADMIN:   'admin',
  PARTNER: 'partner',
} as const;

// ─── HTTP Status ──────────────────────────────────────────────────────────────
export const HTTP = {
  OK:          200,
  CREATED:     201,
  BAD_REQUEST: 400,
  UNAUTHORIZED:401,
  FORBIDDEN:   403,
  NOT_FOUND:   404,
  CONFLICT:    409,
  SERVER_ERROR:500,
} as const;