# MarketHub - Market Management System

A comprehensive digital platform for managing vendor records, stall rentals, and payment transactions for public markets in Boac, Marinduque.

## Core Features

**For Vendors:**
- Fast registration and authentication to manage business details.
- Browse stalls and apply digitally via a unified queue.
- Upload proofs of payment and track pending/active leases.
- Real-time notification center for application updates and dues.

**For Administrators:**
- Comprehensive vendor directory and account restraint controls (suspensions).
- Live stall occupancy tracking with dynamic pricing overrides.
- Unified application review system with an inline document viewer for business permits.
- Arrears tracking, cash payment logging, and automated payment verification.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js 
- **Styling:** Tailwind CSS & shadcn/ui

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install -g pnpm
   pnpm install
   ```

2. **Environment Variables:** Create a `.env.local`:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
   ```

3. **Initialize Database & Seed Data:**
   ```bash
   npx prisma db push
   node scripts/seed.js
   ```

4. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Demo Account
- **Email:** admin@markethub.local
- **Password:** admin123456
*(Make sure to cycle credentials in a production environment)*

## Deployment

Deployable instantly via [Vercel](https://vercel.com). Connect your repository, set the `.env` variables outlined above, and build utilizing the Next.js runtime. Note that Vercel is serverless, meaning you should transition SQLite to a hosted database (like PostgreSQL) and use an object store like AWS S3 or Vercel Blob for persistent file uploads prior to serious production use.
