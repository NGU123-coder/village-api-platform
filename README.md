# Village API: Enterprise-Grade Geo-Data SaaS Platform

A high-performance, full-stack SaaS platform providing comprehensive geographical data for Indian villages. Built with a focus on scalability, security, and developer experience.

## 🚀 Live Demo
- **Dashboard:** [Link to Vercel/Railway Deployment]
- **API Documentation:** Integrated Playground inside the Client Portal.

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Zustand, Lucide Icons, Recharts.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM.
- **Database:** PostgreSQL (Primary), Redis (Caching & Rate Limiting).
- **Auth:** JWT (User Session), Bcrypt (Password & API Key Hashing).
- **Data:** 600k+ MDDS records (State-District-SubDistrict-Village hierarchy).

## ✨ Key Features

### 1. Advanced API Key System
- **Secure Provisioning:** Generate multiple API keys per user.
- **Hashing:** Keys are hashed using `Bcrypt` before storage; raw secrets are shown only once.
- **Verification:** Middleware-based authentication using `x-api-key` header with `id.secret` prefix validation.

### 2. Multi-Tier SaaS Engine
- **Quota Management:** Daily limits enforced via Redis atomic counters with Prisma fallbacks.
- **SaaS Tiers:** Free, Premium, Pro, and Unlimited plans with varying daily quotas.
- **Plan-Based Access:** Restricts geographical scope (e.g., Free users limited to 1 state).

### 3. High-Performance Search (Autocomplete)
- **Sub-100ms Latency:** Optimized using PostgreSQL **GIN Trigram Indexes** (`pg_trgm`).
- **Smart Ranking:** Exact matches > Prefix matches > Fuzzy matches (Levenshtein distance).
- **UX Polish:** Debounced input, keyboard navigation, and term highlighting.

### 4. Enterprise Analytics & Billing
- **Real-time Metrics:** Usage trends, success rates, and latency tracking using Recharts.
- **Simulated Billing:** Stripe-like checkout flow with persistent transaction history and plan lifecycle management.

## 🏗️ Architecture & Optimization

### Autocomplete Optimization
To handle over 600,000 village records, I moved beyond standard `ILIKE` queries:
- **Indexing:** Implemented a GIN index on trigrams of village names.
- **Raw SQL:** Utilized `prisma.$queryRaw` to leverage native PostgreSQL similarity functions.
- **Layered Caching:** Popular queries are cached in Redis for 10 minutes.

### Resilience Strategy
- **Redis Fallback:** The system automatically detects Redis outages and switches to real-time Prisma `count()` queries to ensure 100% uptime for quota enforcement.
- **Global Error Interceptor:** Axios interceptors handle 401s, timeouts, and network failures with user-friendly UI feedback.

## 📦 Installation & Setup

1. **Clone & Install:**
   ```bash
   git clone [repo-url]
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Environment Setup:** Create `.env` in `backend/` with `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`.
3. **Database Migration:** `npx prisma migrate dev`.
4. **Data Import:** `npx ts-node scripts/importExcel.ts`.
5. **Run:** `npm run dev` in both folders.

## 🧪 Testing & Integration

### API Authentication
External clients must use the `x-api-key` header to authenticate requests.

- **Header Name:** `x-api-key`
- **Format:** `<key_id>.<secret>` (e.g., `550e8400-e29b-41d4-a716-446655440000.abcd1234...`)
- **Validation:** The `key_id` is used for lookup, and the `secret` is verified against a secure bcrypt hash.

### Tools (Postman / Thunder Client)
1. Set the request type to `GET`.
2. Navigate to the **Headers** tab.
3. Add a new header: `x-api-key`.
4. Paste your full API key as the value.

## 📜 License
MIT
