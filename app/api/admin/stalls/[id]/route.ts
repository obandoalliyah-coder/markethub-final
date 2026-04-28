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
    const body = await request.json()
    const { stallNumber, location, size, monthlyRate, status, images, productType } = body

    if (stallNumber) {
      const conflict = await prisma.stall.findFirst({
        where: { stallNumber, NOT: { id } },
      })
      if (conflict) {
        return NextResponse.json(
          { error: `Stall number "${stallNumber}" is already in use.` },
          { status: 409 }
        )
      }
    }

    const stall = await prisma.stall.update({
      where: { id },
      data: {
        ...(stallNumber !== undefined && { stallNumber }),
        ...(location !== undefined && { location }),
        ...(size !== undefined && { size }),
        ...(monthlyRate !== undefined && { monthlyRate: parseFloat(monthlyRate) }),
        ...(status !== undefined && { status }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        ...(productType !== undefined && { productType: JSON.stringify(productType) }),
      },
    })

    return NextResponse.json(stall)
  } catch (error) {
    console.error('Error updating stall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const stall = await prisma.stall.findUnique({ where: { id } })

    if (!stall) {
      return NextResponse.json({ error: 'Stall not found' }, { status: 404 })
    }

    if (stall.status === 'OCCUPIED') {
      return NextResponse.json(
        { error: 'Cannot delete an occupied stall. Remove the vendor assignment first.' },
        { status: 409 }
      )
    }

    await prisma.stall.delete({ where: { id } })
    return NextResponse.json({ message: 'Stall deleted successfully.' })
  } catch (error) {
    console.error('Error deleting stall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}