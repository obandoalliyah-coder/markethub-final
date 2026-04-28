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

    const payments = await prisma.payment.findMany({
      where: { vendorId: user.vendorProfile.id },
      include: { stall: true }, // ← FIXED: was missing, caused stall number to show "—"
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
