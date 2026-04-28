import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const stall = await prisma.stall.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            vendor: {
              include: { user: { select: { name: true, email: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          include: {
            vendor: {
              include: { user: { select: { name: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!stall) {
      return NextResponse.json({ error: 'Stall not found' }, { status: 404 })
    }

    return NextResponse.json(stall)
  } catch (error) {
    console.error('Error fetching stall report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
