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

    const application = await prisma.stallApplication.findUnique({
      where: { id },
      include: { vendor: true, stall: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be approved.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const contractStart = now
    const contractEnd = new Date(now)
    contractEnd.setFullYear(contractEnd.getFullYear() + 1)

    if (application.applicationType === 'RENEWAL') {
      // For renewals: extend the contract, keep stall OCCUPIED
      await prisma.$transaction([
        prisma.stallApplication.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvalDate: now,
            contractStart,
            contractEnd,
          },
        }),
        // Make sure stall stays occupied by this vendor
        prisma.stall.update({
          where: { id: application.stallId },
          data: {
            status: 'OCCUPIED',
            occupiedBy: application.vendorId,
            occupationDate: now,
          },
        }),
        prisma.notification.create({
          data: {
            vendorId: application.vendorId,
            type: 'RENEWAL_APPROVED',
            title: 'Contract Renewal Approved',
            message: `Your renewal for Stall ${application.stall.stallNumber} has been approved! Your new contract runs from ${contractStart.toLocaleDateString('en-PH')} to ${contractEnd.toLocaleDateString('en-PH')}.`,
            relatedApplicationId: application.id,
          },
        }),
      ])
    } else {
      // For new applications: standard approval flow
      if (application.stall.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'This stall is no longer available.' },
          { status: 409 }
        )
      }

      await prisma.$transaction([
        prisma.stallApplication.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvalDate: now,
            contractStart,
            contractEnd,
          },
        }),
        prisma.stall.update({
          where: { id: application.stallId },
          data: {
            status: 'OCCUPIED',
            occupiedBy: application.vendorId,
            occupationDate: now,
          },
        }),
        prisma.notification.create({
          data: {
            vendorId: application.vendorId,
            type: 'APPLICATION_APPROVED',
            title: 'Stall Application Approved',
            message: `Congratulations! Your application for Stall ${application.stall.stallNumber} has been approved. Your contract runs from ${contractStart.toLocaleDateString('en-PH')} to ${contractEnd.toLocaleDateString('en-PH')}.`,
            relatedApplicationId: application.id,
          },
        }),
      ])
    }

    return NextResponse.json({ message: 'Application approved successfully.' })
  } catch (error) {
    console.error('Error approving application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}