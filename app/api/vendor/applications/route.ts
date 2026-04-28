import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { vendorProfile: true },
    })

    if (!user?.vendorProfile) {
      return NextResponse.json([], { status: 200 })
    }

    const applications = await prisma.stallApplication.findMany({
      where: { vendorId: user.vendorProfile.id },
      include: { stall: true },
      orderBy: { applicationDate: 'desc' },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { vendorProfile: true },
    })

    if (!user?.vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    if (user.vendorProfile.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Your vendor profile must be approved before applying for stalls.' },
        { status: 403 }
      )
    }

    const { stallId, intendedUseType, applicationType = 'NEW' } = await request.json()

    if (!['NEW', 'RENEWAL'].includes(applicationType)) {
      return NextResponse.json({ error: 'Invalid application type.' }, { status: 400 })
    }

    // --- RENEWAL VALIDATIONS ---
    if (applicationType === 'RENEWAL') {
      // Must have an existing APPROVED or EXPIRED application for this stall
      const existingApp = await prisma.stallApplication.findFirst({
        where: {
          vendorId: user.vendorProfile.id,
          stallId,
          status: { in: ['APPROVED', 'EXPIRED'] },
        },
      })

      if (!existingApp) {
        return NextResponse.json(
          { error: 'No active or expired contract found for this stall to renew.' },
          { status: 400 }
        )
      }

      // Check if a renewal application is already pending or approved
      const existingRenewal = await prisma.stallApplication.findFirst({
        where: {
          vendorId: user.vendorProfile.id,
          stallId,
          applicationType: 'RENEWAL',
          status: { in: ['PENDING', 'APPROVED'] },
        },
      })

      if (existingRenewal) {
        return NextResponse.json(
          { error: 'You already have a pending or active renewal for this stall.' },
          { status: 409 }
        )
      }

      // Block renewal if there are outstanding (PENDING, OVERDUE, REJECTED) payments
      const outstandingPayments = await prisma.payment.findMany({
        where: {
          vendorId: user.vendorProfile.id,
          stallId,
          status: { in: ['PENDING', 'OVERDUE', 'REJECTED'] },
        },
      })

      if (outstandingPayments.length > 0) {
        const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + p.amount, 0)
        return NextResponse.json(
          {
            error: `You have outstanding balance of ₱${totalOutstanding.toLocaleString()} for this stall. Please settle all payments before renewing.`,
            outstandingBalance: totalOutstanding,
            outstandingCount: outstandingPayments.length,
          },
          { status: 400 }
        )
      }
    }

    // --- NEW APPLICATION VALIDATIONS ---
    if (applicationType === 'NEW') {
      const existingApp = await prisma.stallApplication.findFirst({
        where: {
          vendorId: user.vendorProfile.id,
          stallId,
          applicationType: 'NEW',
          status: { in: ['PENDING', 'APPROVED'] },
        },
      })

      if (existingApp) {
        return NextResponse.json(
          { error: 'You have already applied for this stall.' },
          { status: 409 }
        )
      }

      // Check stall is available
      const stall = await prisma.stall.findUnique({ where: { id: stallId } })
      if (!stall || stall.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'This stall is not available.' },
          { status: 409 }
        )
      }
    }

    const application = await prisma.stallApplication.create({
      data: {
        vendorId: user.vendorProfile.id,
        stallId,
        intendedUseType,
        applicationType,
        status: 'PENDING',
      },
      include: { stall: true },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}