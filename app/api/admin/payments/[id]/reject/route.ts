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
    const reason: string = body.reason || 'Payment proof could not be verified. Please resubmit.'

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { vendor: true, stall: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only submitted payments can be rejected.' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          proofDocument: null,
          paidDate: null,
        },
      }),
      prisma.notification.create({
        data: {
          vendorId: payment.vendorId,
          type: 'PAYMENT_REJECTED',
          title: 'Payment Rejected',
          message: `Your payment for Stall ${payment.stall.stallNumber} was rejected. Reason: ${reason} Please upload a new proof of payment.`,
          relatedPaymentId: payment.id,
        },
      }),
    ])

    return NextResponse.json({ message: 'Payment rejected.' })
  } catch (error) {
    console.error('Error rejecting payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}