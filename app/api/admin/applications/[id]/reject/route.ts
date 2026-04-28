import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason: string = body.reason || 'Application did not meet the requirements.'

    const application = await prisma.stallApplication.findUnique({
      where: { id },
      include: { vendor: true, stall: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be rejected.' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.stallApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
        },
      }),
      prisma.notification.create({
        data: {
          vendorId: application.vendorId,
          type: 'APPLICATION_REJECTED',
          title: 'Stall Application Rejected',
          message: `Your application for Stall ${application.stall.stallNumber} was not approved. Reason: ${reason}`,
          relatedApplicationId: application.id,
        },
      }),
    ])

    return NextResponse.json({ message: 'Application rejected.' })
  } catch (error) {
    console.error('Error rejecting application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}