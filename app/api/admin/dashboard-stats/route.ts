import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get vendor stats
    const totalVendors = await prisma.vendorProfile.count()

    const approvedVendors = await prisma.vendorProfile.count({
      where: { status: 'APPROVED' },
    })

    // Get stall stats
    const totalStalls = await prisma.stall.count()
    const occupiedStalls = await prisma.stall.count({
      where: { status: 'OCCUPIED' },
    })

    // Get application stats
    const pendingApplications = await prisma.stallApplication.count({
      where: { status: 'PENDING' },
    })

    // Get payment stats
    const pendingPayments = await prisma.payment.count({
      where: { status: { in: ['PENDING', 'SUBMITTED'] } },
    })

    const verifiedPayments = await prisma.payment.count({
      where: { status: 'VERIFIED' },
    })

    // Get total revenue
    const payments = await prisma.payment.findMany({
      where: { status: 'VERIFIED' },
      select: { amount: true },
    })

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

    return NextResponse.json({
      totalVendors,
      approvedVendors,
      pendingApplications,
      totalStalls,
      occupiedStalls,
      pendingPayments,
      verifiedPayments,
      totalRevenue,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
