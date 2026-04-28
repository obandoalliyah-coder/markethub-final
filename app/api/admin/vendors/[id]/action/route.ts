import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is usually a Promise, or handled dynamically
) {
  try {
    const session = await auth()
    
    // Admins only
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    let nextStatus = 'PENDING'
    if (action === 'APPROVE') nextStatus = 'APPROVED'
    if (action === 'REJECT') nextStatus = 'REJECTED'
    if (action === 'SUSPEND') nextStatus = 'SUSPENDED'

    const updatedProfile = await prisma.vendorProfile.update({
      where: { id: id },
      data: { status: nextStatus },
    })

    // Dispatch a notification to the vendor
    await prisma.notification.create({
      data: {
        vendorId: updatedProfile.id,
        type: `PROFILE_${nextStatus}`,
        title: `Profile ${nextStatus}`,
        message: `Your vendor profile has been ${nextStatus.toLowerCase()} by an administrator.`,
      }
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating vendor status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
