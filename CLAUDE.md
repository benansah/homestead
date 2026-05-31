# hostelGH — Project Handoff Guide

## What This Is
Student hostel finder platform for Ghana. Zillow-style UI. Blue accent #006AFF.

## Stack
- **Backend**: Express.js + PostgreSQL — runs on **port 5001** (DB is on port 6000)
- **Frontend**: Next.js 15 + TypeScript + Tailwind — runs on **port 3000**
- **Payments**: Paystack (GHS 50 viewing fee)
- **Images**: Cloudinary
- **Auth**: JWT with roles: `student`, `landlord`, `admin`

## File Structure
```
/backend/src/
  app.js                  ← main Express app (port 5001)
  controllers/            ← all business logic
  routes/                 ← mounted routes
  middleware/             ← authMiddleware, roles, validate
  services/               ← paystack.js, cloudinary.js, email.js, n8n.js
/backend/database/
  schema.sql              ← full DB schema
  db.js                   ← pg Pool connection
/frontend/
  app/                    ← Next.js pages (App Router)
  components/             ← Navbar, HostelCard, Guards
  context/AuthContext.tsx ← JWT auth context
  lib/api.tsx             ← axios instance → http://localhost:5001/api
  types/index.ts          ← all shared TypeScript interfaces
```

## What's Fully Built & Backend/Frontend Aligned
- Auth (register/login) — `/api/users`
- Hostels CRUD + admin approval — `/api/hostels`
- Rooms CRUD — `/api/rooms`
- Bookings + Paystack payment + contact release — `/api/bookings`
- Search — `/api/search`
- Notifications — `/api/notifications`
- Wishlist — `/api/wishlist`
- Reviews — `/api/reviews`
- Referrals — `/api/referrals`
- Uploads (Cloudinary) — `/api/uploads`
- **Roommate matching** — `/api/roommates` (profile, matches, requests) — fully built both ends

## Known Bugs — FIXED
- ✅ Paystack callback URL fixed → `http://localhost:3000/bookings/verify`
- ✅ 5 orphan route files deleted
- ✅ `bookingValidators.js` created (was missing — caused server crash on startup)
- ✅ Leaflet maps added (HostelMap + BrowseMap, SSR-disabled dynamic imports)
- ✅ Multi-person room booking: Group_bookings table, controller, routes, frontend UI

## Still Needs Before Deploy
- Run `backend/database/migration_group_bookings.sql` on the live DB
- Change `JWT_SECRET=mysecretkey` to a real 64-char random string
- Set real `PAYSTACK_SECRET_KEY` (not the placeholder sk_test_xxx)

### 2. Orphan / dead files (cleanup)
- `backend/src/routes/auth.js` — old standalone Express app, never imported. Delete it.
- `backend/src/routes/payments.js` — empty file. Delete it.
- `backend/src/routes/notifications.js` — duplicate of `notificationRoutes.js`, never imported. Delete it.
- `backend/src/routes/referrals.js` — duplicate of `referralRoutes.js`, never imported. Delete it.
## What's Next

### n8n automation
Weekly WhatsApp availability check. `backend/src/services/n8n.js` exists as a stub.
- Set up n8n self-hosted or cloud
- Create webhook that n8n calls → backend updates `Availability` table
- Backend notifies wishlist users when a room becomes available

### Deployment
- Run `migration_group_bookings.sql` on the DB first
- **Backend → Railway**: set env vars, connect Railway PostgreSQL, use schema.sql
- **Frontend → Vercel**: set `NEXT_PUBLIC_API_URL` to Railway backend URL
- Update `PAYSTACK_CALLBACK_URL` to Vercel frontend URL (e.g. `https://hostelgh.vercel.app/bookings/verify`)
- Set real `JWT_SECRET` (random 64-char string)

## API Base URL
- Dev: `http://localhost:5001/api`
- Set in `frontend/.env.local` as `NEXT_PUBLIC_API_URL`

## Database
- PostgreSQL on port 6000
- Connection string: `postgresql://postgres:admin@localhost:6000/hostel_finder`
- Schema: `backend/database/schema.sql`
- Seed: `backend/database/seed.js`
