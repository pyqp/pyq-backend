# PYQPB Backend API

Complete Node.js/Express backend for PYQPB (Previous Year Questions Practice Bank) platform.

## 🚀 Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Razorpay
- **Email**: Nodemailer
- **Security**: Helmet, bcrypt, express-rate-limit
- **Validation**: express-validator

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js             # User model with auth
│   ├── Exam.js             # Exam categories
│   ├── MockTest.js         # Mock test with questions
│   ├── PYQ.js              # Previous year questions
│   ├── TestAttempt.js      # User test attempts
│   ├── Payment.js          # Payment transactions
│   └── Result.js           # Test results & analytics
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User profile routes
│   ├── examRoutes.js       # Exam management
│   ├── pyqRoutes.js        # PYQ routes
│   ├── mockTestRoutes.js   # Mock test routes
│   ├── creditRoutes.js     # Credit management
│   ├── paymentRoutes.js    # Razorpay integration
│   ├── resultRoutes.js     # Results & analytics
│   ├── contactRoutes.js    # Contact form
│   └── adminRoutes.js      # Admin panel routes
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── examController.js
│   ├── mockTestController.js
│   ├── paymentController.js
│   └── ...
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── errorHandler.js    # Global error handler
│   ├── rateLimiter.js     # Rate limiting
│   └── validate.js        # Input validation
├── utils/
│   ├── sendEmail.js       # Email utility
│   ├── generateToken.js   # Token generator
│   └── responseHandler.js # API response formatter
├── .env.example           # Environment variables template
├── package.json
└── server.js             # Main entry point
```

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Required
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pyqpb
JWT_SECRET=your_super_secret_key_change_this

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
# Start MongoDB service
mongod

# Create database
mongo
use pyqpb
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update MONGODB_URI in .env

### 4. Gmail App Password (for emails)

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password
4. Use in EMAIL_PASSWORD

### 5. Razorpay Setup

1. Sign up at razorpay.com
2. Get API keys from Dashboard
3. Add to .env file

## 🚀 Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Test Mode
```bash
npm test
```

## 📡 API Endpoints

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| GET | `/me` | Get current user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| PUT | `/reset-password/:token` | Reset password | No |
| PUT | `/verify-email/:token` | Verify email | No |
| POST | `/resend-verification` | Resend verification email | Yes |

### User Routes (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update profile | Yes |
| PUT | `/change-password` | Change password | Yes |
| DELETE | `/account` | Delete account | Yes |
| GET | `/dashboard` | Get dashboard stats | Yes |
| GET | `/test-history` | Get test attempts | Yes |

### Exam Routes (`/api/v1/exams`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all exams | No |
| GET | `/:id` | Get exam by ID | No |
| GET | `/:slug` | Get exam by slug | No |
| GET | `/category/:category` | Get exams by category | No |
| POST | `/` | Create exam (Admin) | Yes |
| PUT | `/:id` | Update exam (Admin) | Yes |
| DELETE | `/:id` | Delete exam (Admin) | Yes |

### Mock Test Routes (`/api/v1/mock-tests`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all mock tests | No |
| GET | `/:id` | Get test details | No |
| GET | `/exam/:examId` | Tests by exam | No |
| POST | `/unlock/:id` | Unlock test (uses credit) | Yes |
| POST | `/start/:id` | Start test attempt | Yes |
| POST | `/submit/:attemptId` | Submit test | Yes |
| GET | `/my-tests` | Get user's unlocked tests | Yes |

### Payment Routes (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-order` | Create Razorpay order | Yes |
| POST | `/verify` | Verify payment | Yes |
| GET | `/history` | Payment history | Yes |
| POST | `/refund/:id` | Request refund | Yes |

### PYQ Routes (`/api/v1/pyqs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all PYQs | No |
| GET | `/:id` | Get PYQ by ID | No |
| GET | `/exam/:examId` | PYQs by exam | No |
| GET | `/download/:id` | Download PYQ PDF | No |

### Result Routes (`/api/v1/results`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/attempt/:attemptId` | Get attempt result | Yes |
| GET | `/analytics/:attemptId` | Detailed analytics | Yes |
| GET | `/ranking/:testId` | All India ranking | Yes |
| GET | `/compare/:attemptId` | Compare with average | Yes |

## 🔐 Authentication

### JWT Token Flow

1. User logs in → Server generates JWT
2. Token sent in response
3. Client stores token (localStorage/cookie)
4. Client sends token in header: `Authorization: Bearer <token>`
5. Server validates token for protected routes

### Protected Route Example

```javascript
// Require auth middleware
const { protect } = require('../middleware/auth');

// Apply to route
router.get('/profile', protect, getProfile);
```

## 💳 Payment Integration (Razorpay)

### Payment Flow

1. **Create Order**: `POST /api/v1/payments/create-order`
   ```json
   {
     "package": "best-value",
     "amount": 499
   }
   ```

2. **Frontend**: Open Razorpay checkout
   ```javascript
   const options = {
     key: RAZORPAY_KEY_ID,
     amount: order.amount,
     order_id: order.id,
     handler: function(response) {
       // Verify payment
     }
   };
   ```

3. **Verify Payment**: `POST /api/v1/payments/verify`
   ```json
   {
     "razorpay_order_id": "order_xxx",
     "razorpay_payment_id": "pay_xxx",
     "razorpay_signature": "signature_xxx"
   }
   ```

4. **Credits Added**: User credits updated automatically

## 📧 Email System

Automated emails sent for:
- Email verification
- Password reset
- Payment confirmation
- Test results
- Credit expiry reminders

Configure in `utils/sendEmail.js`

## 🔒 Security Features

✅ **Password Hashing**: bcrypt with salt rounds
✅ **JWT Authentication**: Secure token-based auth
✅ **Rate Limiting**: Prevent brute force attacks
✅ **Data Sanitization**: Prevent NoSQL injection
✅ **Helmet**: Security headers
✅ **CORS**: Configured for frontend origin
✅ **Input Validation**: express-validator
✅ **SQL Injection Protection**: Mongoose built-in
✅ **XSS Protection**: Data sanitization

## 📊 Database Models

### User Model
- Authentication & profile data
- Credits & subscription
- Test history & analytics
- Password reset & verification

### Exam Model
- Exam details & pattern
- Sections & subjects
- Eligibility criteria
- Statistics

### MockTest Model
- Test configuration
- Questions with options
- Solutions & explanations
- Ranking & statistics

### TestAttempt Model
- User responses
- Score calculation
- Time tracking
- Rank generation

### Payment Model
- Transaction details
- Razorpay integration
- Refund status
- Invoice generation

## 🐛 Error Handling

Global error handler catches:
- Validation errors
- Database errors
- Authentication errors
- Custom API errors

Example error response:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 🚀 Deployment

### Heroku
```bash
heroku create pyqpb-api
git push heroku main
heroku config:set NODE_ENV=production
```

### AWS EC2
```bash
# Install Node.js
# Install MongoDB
# Clone repository
# Install dependencies
# Configure .env
# Use PM2 for process management
pm2 start server.js --name pyqpb-api
pm2 save
pm2 startup
```

### Docker
```bash
docker build -t pyqpb-backend .
docker run -p 5000:5000 pyqpb-backend
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries
- **Caching**: Redis for frequently accessed data
- **Compression**: gzip compression enabled
- **Query Optimization**: Mongoose lean() for read operations
- **Pagination**: Limit results per page

## 🔍 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Winston**: Application logging
- **PM2**: Process monitoring
- **Error Tracking**: Sentry integration (optional)

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Razorpay API](https://razorpay.com/docs/api/)
- [JWT.io](https://jwt.io/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

ISC License

## 👥 Support

For issues and questions:
- Email: support@pyqpb.com
- Documentation: /api/v1/docs
- GitHub Issues: Create an issue

---

**Built with ❤️ by PYQPB Team**#   p y q - b a c k e n d  
 