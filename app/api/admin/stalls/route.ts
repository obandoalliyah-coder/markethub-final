import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const stalls = await prisma.stall.findMany({
      orderBy: { stallNumber: 'asc' },
    })
    return NextResponse.json(stalls)
  } catch (error) {
    console.error('Error fetching stalls:', error)
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
    const { stallNumber, location, size, monthlyRate, status, images, productType } = body

    if (!stallNumber || !location || !monthlyRate) {
      return NextResponse.json(
        { error: 'stallNumber, location, and monthlyRate are required.' },
        { status: 400 }
      )
    }

    const existing = await prisma.stall.findUnique({ where: { stallNumber } })
    if (existing) {
      return NextResponse.json(
        { error: `Stall number "${stallNumber}" already exists.` },
        { status: 409 }
      )
    }

    const stall = await prisma.stall.create({
      data: {
        stallNumber,
        location,
        size: size || null,
        monthlyRate: parseFloat(monthlyRate),
        status: status || 'AVAILABLE',
        images: images ? JSON.stringify(images) : null,
        productType: productType ? JSON.stringify(productType) : null,
      },
    })

    return NextResponse.json(stall, { status: 201 })
  } catch (error) {
    console.error('Error creating stall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}