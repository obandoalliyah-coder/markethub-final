import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const paymentId = formData.get('paymentId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, vendorId: user.vendorProfile.id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const blob = await put(`payments/${file.name}`, file, { access: 'public' })

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        proofDocument: blob.url,
        status: 'SUBMITTED',
        paidDate: new Date(),
      },
    })

    return NextResponse.json({ url: blob.url, payment: updated })
  } catch (error) {
    console.error('Error uploading payment proof:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}