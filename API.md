# PYQPB API Reference

**Base URL:** `https://api.pyqpb.com/api/v1`  
**Auth:** `Authorization: Bearer <token>`

---

## Auth `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, get tokens |
| POST | `/auth/logout` | ✓ | Clear auth cookies |
| POST | `/auth/refresh-token` | — | Refresh access token |
| GET | `/auth/me` | ✓ | Get current user |
| POST | `/auth/verify-email` | — | Verify email OTP |
| POST | `/auth/resend-verification` | — | Resend OTP |
| POST | `/auth/forgot-password` | — | Send reset email |
| POST | `/auth/reset-password/:token` | — | Reset password |
| PUT | `/auth/change-password` | ✓ | Change password |

### Register
```json
POST /auth/register
{ "name": "Ravi Kumar", "email": "ravi@gmail.com", "password": "Ravi@1234", "phone": "9876543210", "referralCode": "FRIEND01" }
```

### Login
```json
POST /auth/login
{ "email": "ravi@gmail.com", "password": "Ravi@1234" }
```

---

## Users `/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | ✓ | Get profile |
| PUT | `/users/profile` | ✓ | Update profile |
| PUT | `/users/preferences` | ✓ | Update preferences |
| GET | `/users/dashboard` | ✓ | Dashboard data |
| GET | `/users/test-history` | ✓ | Test history (paginated) |
| DELETE | `/users/account` | ✓ | Deactivate account |

---

## Exams `/exams`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/exams` | — | All exams (cached 5 min) |
| GET | `/exams/popular` | — | Top exams |
| GET | `/exams/categories/list` | — | Exam categories |
| GET | `/exams/search?q=upsc` | — | Search exams |
| GET | `/exams/category/:cat` | — | Exams by category |
| GET | `/exams/slug/:slug` | — | Exam by slug |
| GET | `/exams/:id` | — | Exam by ID |
| POST | `/exams` | Admin | Create exam |
| PUT | `/exams/:id` | Admin | Update exam |
| DELETE | `/exams/:id` | Admin | Delete exam |

---

## Packages `/packages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/packages` | — | All packages (cached 15 min) |
| GET | `/packages/popular` | — | Most popular package |
| GET | `/packages/compare` | — | Package comparison |
| GET | `/packages/:id` | — | Package by ID |

---

## Mock Tests `/mock-tests`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/mock-tests` | — | List mock tests |
| GET | `/mock-tests/:id` | — | Test detail |
| POST | `/mock-tests/:id/start` | ✓ | Start test (deducts credit) |
| PATCH | `/mock-tests/:id/save-answer` | ✓ | Auto-save answer |
| POST | `/mock-tests/:id/submit` | ✓ | Submit test |
| GET | `/mock-tests/:id/my-attempts` | ✓ | My attempts |
| POST | `/mock-tests` | Admin | Create mock test |

### Start Test Response
```json
{
  "attemptId": "...", "questions": [...],
  "duration": 120, "creditsDeducted": 1, "remainingCredits": 4
}
```

### Save Answer
```json
{ "attemptId": "...", "questionNumber": 1, "userAnswer": 2, "timeSpent": 45, "markedForReview": false }
```

---

## Results `/results`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/results` | ✓ | My results |
| GET | `/results/:id` | ✓ | Result detail |
| GET | `/results/:id/analytics` | ✓ | Deep analytics |
| GET | `/results/:id/scorecard` | ✓ | Download PDF scorecard |

---

## Rankings `/rankings`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rankings/:testId/leaderboard` | — | Leaderboard |
| GET | `/rankings/:testId/my-rank` | ✓ | My rank + neighbors |
| GET | `/rankings/:testId/stats` | — | Score distribution stats |

---

## Payments `/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-order` | ✓ | Create Razorpay order |
| POST | `/payments/verify` | ✓ | Verify payment signature |
| GET | `/payments/history` | ✓ | Payment history |
| GET | `/payments/:id` | ✓ | Payment detail |
| POST | `/payments/webhook` | — | Razorpay webhook |

### Create Order
```json
{ "packageId": "...", "offerCode": "SAVE20" }
```
**Response:**
```json
{ "orderId": "order_xxx", "amount": 159, "currency": "INR", "credits": 10, "razorpayKey": "rzp_live_xxx", "discount": { "applied": true, "amount": 40, "code": "SAVE20" } }
```

### Verify Payment
```json
{ "orderId": "order_xxx", "paymentId": "pay_xxx", "signature": "hmac_hex" }
```

---

## Credits `/credits`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/credits/balance` | ✓ | Balance + batches |
| GET | `/credits/history` | ✓ | Transaction ledger |
| GET | `/credits/summary` | ✓ | Aggregated stats |

---

## Referrals `/referrals`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/referrals/validate-code?code=XXX` | — | Validate referral code |
| GET | `/referrals/dashboard` | ✓ | Referral stats |
| GET | `/referrals/history` | ✓ | Referral history |

---

## Offers `/offers`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/offers` | — | Active offers |
| GET | `/offers/:code` | — | Offer by code |
| POST | `/offers/validate` | ✓ | Validate offer for package |
| POST | `/offers` | Admin | Create offer |
| PUT | `/offers/:id` | Admin | Update offer |
| DELETE | `/offers/:id` | Admin | Delete offer |

---

## Refunds `/refunds`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/refunds/request` | ✓ | Submit refund request |
| GET | `/refunds/my-refunds` | ✓ | My refund requests |
| GET | `/refunds` | Admin | All refunds |
| PATCH | `/refunds/:id/process` | Admin | Approve/reject refund |

---

## Contact `/contact`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/contact` | — | Submit support ticket (5/hr limit) |
| GET | `/contact` | Admin | All tickets |
| GET | `/contact/:id` | Admin | Ticket detail |
| PATCH | `/contact/:id` | Admin | Update ticket status |

---

## Blog `/blog`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blog` | — | Published posts |
| GET | `/blog/:slug` | — | Post by slug |
| POST | `/blog` | Admin | Create post |
| PUT | `/blog/:id` | Admin | Update post |
| DELETE | `/blog/:id` | Admin | Archive post |

---

## PYQs `/pyqs`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pyqs` | — | All PYQs |
| GET | `/pyqs/exam/:examId` | — | PYQs by exam |
| GET | `/pyqs/:id` | — | PYQ detail |
| POST | `/pyqs` | Admin | Create PYQ entry |

---

## Admin `/admin`

All routes require `Admin` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | KPIs overview |
| GET | `/admin/analytics/revenue` | Revenue charts |
| GET | `/admin/analytics/users` | User growth |
| GET | `/admin/analytics/tests` | Test analytics |
| GET | `/admin/users` | User list (search, filter) |
| GET | `/admin/users/:id` | User detail |
| PATCH | `/admin/users/:id/toggle-status` | Ban/unban user |
| POST | `/admin/users/:id/grant-credits` | Grant credits |
| GET | `/admin/questions` | Question bank |
| GET | `/admin/questions/stats` | Stats per exam |
| POST | `/admin/questions/bulk` | Bulk upload (max 500) |
| DELETE | `/admin/questions/:id` | Soft delete question |

---

## Error Responses

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Server error |