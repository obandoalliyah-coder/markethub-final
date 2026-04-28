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
    const status = searchParams.get('status')

    const payments = await prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: {
        vendor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        stall: true,
        application: true,
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vendorId, stallId, applicationId, amount, dueDate, paymentType, month, year } = body

    if (!vendorId || !stallId || !applicationId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'vendorId, stallId, applicationId, amount, and dueDate are required.' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        vendorId,
        stallId,
        applicationId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        paymentType: paymentType || 'MONTHLY',
        month: month || null,
        year: year || null,
        status: 'PENDING',
      },
    })

    // Notify vendor
    await prisma.notification.create({
      data: {
        vendorId,
        type: 'PAYMENT_DUE',
        title: 'Payment Due',
        message: `A payment of ₱${parseFloat(amount).toLocaleString()} is due on ${new Date(dueDate).toLocaleDateString('en-PH')}. Please submit your proof of payment.`,
        relatedPaymentId: payment.id,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}