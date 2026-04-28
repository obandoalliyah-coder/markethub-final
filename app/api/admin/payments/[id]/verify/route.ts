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
    const notes: string = body.notes || ''

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { vendor: true, stall: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only submitted payments can be verified.' },
        { status: 400 }
      )
    }

    const now = new Date()

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verificationDate: now,
          verifiedBy: session.user.email,
          verificationNotes: notes || null,
        },
      }),
      prisma.notification.create({
        data: {
          vendorId: payment.vendorId,
          type: 'PAYMENT_VERIFIED',
          title: 'Payment Verified',
          message: `Your payment of ₱${payment.amount.toLocaleString()} for Stall ${payment.stall.stallNumber} has been verified. Thank you!`,
          relatedPaymentId: payment.id,
        },
      }),
    ])

    return NextResponse.json({ message: 'Payment verified successfully.' })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}