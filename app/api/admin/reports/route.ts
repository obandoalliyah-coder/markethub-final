import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly' // daily | weekly | monthly | custom
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    // Build date range
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now)
    endDate.setHours(23, 59, 59, 999)

    if (type === 'custom' && startParam && endParam) {
      startDate = new Date(startParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(endParam)
      endDate.setHours(23, 59, 59, 999)
    } else if (type === 'daily') {
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
    } else if (type === 'weekly') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else {
      // monthly — current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Payments in range
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        vendor: {
          include: { user: { select: { name: true, email: true } } },
        },
        stall: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Summary calculations
    const totalRevenue = payments
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amount, 0)

    const totalOverdue = payments
      .filter((p) => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0)

    const totalPending = payments
      .filter((p) => ['PENDING', 'SUBMITTED'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0)

    // Payment type breakdown (for verified payments)
    const paymentTypeBreakdown: Record<string, number> = {}
    payments
      .filter((p) => p.status === 'VERIFIED')
      .forEach((p) => {
        paymentTypeBreakdown[p.paymentType] =
          (paymentTypeBreakdown[p.paymentType] || 0) + p.amount
      })

    // Monthly revenue for the last 12 months (for the chart on the reports page)
    const monthlyRevenue: { month: string; revenue: number; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

      const agg = await prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          verificationDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      })

      monthlyRevenue.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: agg._sum.amount || 0,
        count: agg._count,
      })
    }

    return NextResponse.json({
      payments,
      summary: {
        totalRevenue,
        totalOverdue,
        totalPending,
        paymentTypeBreakdown,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalTransactions: payments.length,
      },
      monthlyRevenue,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}