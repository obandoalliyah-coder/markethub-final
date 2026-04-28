import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('x-cron-secret')
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Mark all PENDING payments whose due date has passed as OVERDUE
    const result = await prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    })

    // Send notifications to affected vendors
    if (result.count > 0) {
      const overduedPayments = await prisma.payment.findMany({
        where: {
          status: 'OVERDUE',
          dueDate: { lt: now },
          // Only notify for payments that were just marked overdue today
          updatedAt: { gte: new Date(now.getTime() - 60 * 1000) }, // within last 60 seconds
        },
        include: { stall: true },
      })

      await Promise.all(
        overduedPayments.map((payment) =>
          prisma.notification.create({
            data: {
              vendorId: payment.vendorId,
              type: 'PAYMENT_OVERDUE',
              title: 'Payment Overdue',
              message: `Your payment of ₱${payment.amount.toLocaleString()} for Stall ${payment.stall.stallNumber} (${payment.month ? new Date(payment.year!, payment.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Monthly'}) is now overdue. Please settle this to avoid issues with your contract renewal.`,
              relatedPaymentId: payment.id,
            },
          })
        )
      )
    }

    // Also mark EXPIRED contracts — if contractEnd has passed and status is still APPROVED
    const expiredApps = await prisma.stallApplication.findMany({
      where: {
        status: 'APPROVED',
        contractEnd: { lt: now },
      },
      include: { stall: true },
    })

    if (expiredApps.length > 0) {
      await Promise.all(
        expiredApps.map(async (app) => {
          await prisma.stallApplication.update({
            where: { id: app.id },
            data: { status: 'EXPIRED' },
          })

          // Free up the stall only if vendor has no active renewal application
          const pendingRenewal = await prisma.stallApplication.findFirst({
            where: {
              vendorId: app.vendorId,
              stallId: app.stallId,
              applicationType: 'RENEWAL',
              status: { in: ['PENDING', 'APPROVED'] },
            },
          })

          if (!pendingRenewal) {
            await prisma.stall.update({
              where: { id: app.stallId },
              data: { status: 'AVAILABLE', occupiedBy: null, occupationDate: null },
            })
          }

          // Notify vendor
          await prisma.notification.create({
            data: {
              vendorId: app.vendorId,
              type: 'CONTRACT_EXPIRED',
              title: 'Contract Expired',
              message: `Your contract for Stall ${app.stall.stallNumber} has expired. Please renew your contract to continue occupying the stall.`,
              relatedApplicationId: app.id,
            },
          })
        })
      )
    }

    return NextResponse.json({
      message: 'Cron job completed.',
      paymentsMarkedOverdue: result.count,
      contractsExpired: expiredApps.length,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}