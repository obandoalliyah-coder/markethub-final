# AI Context Document: MarketHub

This document is specifically crafted to provide LLMs and AI Agents with a complete understanding of the MarketHub project.

## 1. Project Overview
MarketHub is a digital platform designed to manage public market operations—specifically targeting the Boac Public Market in Marinduque, Philippines. It bridges the gap between Market Administrators and Vendors by digitizing stall applications, monthly rent tracking, document verification, and financial reporting.

## 2. Technology Stack & Rules
- **Framework:** Next.js 14/15 utilizing the **App Router** (`app/` directory).
  - *Rule:* Always use Server Components by default unless client interactivity (like hooks) is strictly required (`'use client'`).
- **Language:** TypeScript exactly.
- **ORM & Database:** Prisma connected to **PostgreSQL**.
  - *Rule:* Do not write raw SQL unless utilizing `prisma.$queryRaw`.
- **Authentication:** NextAuth.js (v5 Beta) acting on Email/Password Credentials.
  - *Rule:* Authorization relies heavily on the `User.role` field (`ADMIN` vs `VENDOR`). Protect API routes via NextAuth session checks.
- **Styling:** Tailwind CSS v4 and Radix UI primitives.
  - *Rule:* Build custom components over importing bulky pre-packaged UI libraries when possible.
- **Tools:** `recharts` for charting, `xlsx` for Excel export reporting.

## 3. Directory Structure
```text
├── app/
│   ├── (auth)/ or auth/ -> Contains login/signup. Includes NextAuth credentials check.
│   ├── admin/ -> Protected routes for Admins (Dashboard, Stalls, Vendors, Reports).
│   ├── api/ -> Next.js Route Handlers.
│   ├── stalls/ -> Public, guest-accessible Server Component page viewing available stalls.
│   └── vendor/ -> Protected routes for Vendors (Profile, Dashboard).
├── components/ -> Reusable React components.
├── lib/ -> Utility functions (e.g. `db.ts` for Prisma singleton export).
├── prisma/ -> schema.prisma and migrations.
└── scripts/ -> Contains `seed.js` for resetting the database and generating stalls.
```

## 4. Key Workflows & Custom Logic Limits
1. **Forms & Registration:** Registration happens dynamically. The location selector is heavily cascaded and hardcoded explicitly for the **Marinduque** province (Province -> Municipality -> Barangay). After signup, the application calls `signIn` directly to bypass the manual login screen.
2. **Stall Management:** Admins have full CRUD control over stalls. The public view (`/stalls`) only filters where `status === 'AVAILABLE'`. Stalls have specific `productType` categorizations (e.g., 'Vegetables & Fruits').
3. **Database Seeding:** `scripts/seed.js` wipes the `Stall` table explicitly upon run to inject roughly 12 categorized stalls along with an `admin` user and a `vendor` user.

## 5. Complete Database Schema (Prisma)
Below is the exact `schema.prisma` configuration currently active in production:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?
  name          String?
  phone         String?
  role          String    @default("VENDOR") // VENDOR, ADMIN
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  vendorProfile VendorProfile?
  accounts      Account[]

  @@index([email])
  @@index([role])
}

model Account {
  id                 String    @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model VendorProfile {
  id              String        @id @default(cuid())
  userId          String        @unique
  businessName    String
  businessType    String
  ownerName       String
  contactNumber   String
  alternateContactNumber String?
  address         String
  barangay        String
  municipality    String
  province        String
  zipCode         String
  businessPermitNumber String?
  tinNumber       String?
  idDocument      String?
  permitDocument  String?
  profileImage    String?
  status          String        @default("PENDING")
  rejectionReason String?
  approvalDate    DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications    StallApplication[]
  payments        Payment[]
  notifications   Notification[]

  @@index([status])
}

model Stall {
  id            String      @id @default(cuid())
  stallNumber   String      @unique
  location      String
  size          String?
  monthlyRate   Float
  status        String      @default("AVAILABLE")
  occupiedBy    String?
  occupationDate DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  images        String?
  productType   String?

  applications  StallApplication[]
  payments      Payment[]

  @@index([status])
}

model StallApplication {
  id              String            @id @default(cuid())
  vendorId        String
  stallId         String
  status          String            @default("PENDING") // PENDING, APPROVED, REJECTED, EXPIRED
  applicationType String            @default("NEW")     // NEW, RENEWAL
  intendedUseType String?
  applicationDate DateTime          @default(now())
  approvalDate    DateTime?
  rejectionReason String?
  contractStart   DateTime?
  contractEnd     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  vendor          VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  stall           Stall         @relation(fields: [stallId], references: [id], onDelete: Cascade)
  payments        Payment[]

  @@unique([vendorId, stallId, applicationType])
  @@index([vendorId])
  @@index([stallId])
  @@index([status])
  @@index([applicationType])
}

model Payment {
  id                    String        @id @default(cuid())
  vendorId              String
  stallId               String
  applicationId         String
  amount                Float
  dueDate               DateTime
  paidDate              DateTime?
  status                String        @default("PENDING") // PENDING, SUBMITTED, VERIFIED, REJECTED, OVERDUE
  paymentType           String        @default("MONTHLY")
  month                 Int?
  year                  Int?
  proofDocument         String?
  rejectionReason       String?
  verificationNotes     String?
  verifiedBy            String?
  verificationDate      DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  vendor                VendorProfile      @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  stall                 Stall              @relation(fields: [stallId], references: [id], onDelete: Cascade)
  application           StallApplication   @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([vendorId])
  @@index([stallId])
  @@index([applicationId])
  @@index([status])
  @@index([dueDate])
}

model Notification {
  id                    String           @id @default(cuid())
  vendorId              String
  type                  String
  title                 String
  message               String
  isRead                Boolean          @default(false)
  relatedApplicationId  String?
  relatedPaymentId      String?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  vendor VendorProfile @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@index([vendorId])
  @@index([isRead])
  @@index([type])
}

model SystemSetting {
  id                  String   @id @default("global")
  gracePeriodDays     Int      @default(5)
  lateFeePercentage   Int      @default(2)
  baseRateVegetable   Int      @default(1500)
  updatedAt           DateTime @updatedAt
}
```
