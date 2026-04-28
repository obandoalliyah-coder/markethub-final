import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const applications = await prisma.stallApplication.findMany({
      where: { vendorId: id },
      include: {
        stall: {
          select: { stallNumber: true, location: true },
        },
      },
      orderBy: { applicationDate: 'desc' },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching vendor stall history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}