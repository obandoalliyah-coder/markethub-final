import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        vendorProfile: true,
      },
    })

    if (!user?.vendorProfile) {
      return NextResponse.json({
        profileStatus: 'incomplete',
        activeStalls: 0,
        pendingPayments: 0,
        overduePayments: 0,
        unreadNotifications: 0,
      })
    }

    const vendorId = user.vendorProfile.id

    // Get profile status
    const profileStatus = user.vendorProfile.status

    // Get active stalls
    const activeStalls = await prisma.stallApplication.count({
      where: {
        vendorId,
        status: 'ACTIVE',
      },
    })

    // Get pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        vendorId,
        status: 'PENDING',
      },
    })

    // Get overdue payments
    const now = new Date()
    const overduePayments = await prisma.payment.count({
      where: {
        vendorId,
        dueDate: {
          lt: now,
        },
        status: { in: ['PENDING', 'SUBMITTED'] },
      },
    })

    // Get unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        vendorId,
        isRead: false,
      },
    })

    return NextResponse.json({
      profileStatus,
      activeStalls,
      pendingPayments,
      overduePayments,
      unreadNotifications,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}