import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendors = await prisma.vendorProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        applications: {
          include: {
            stall: true
          }
        },
        payments: {
          include: {
            stall: true
          }
        }
      },
      orderBy: { businessName: 'asc' }
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Error fetching vendor history report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
