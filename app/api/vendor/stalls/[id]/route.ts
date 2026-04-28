import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stall = await prisma.stall.findUnique({
      where: { id: params.id },
    })

    if (!stall) {
      return NextResponse.json({ error: 'Stall not found' }, { status: 404 })
    }

    return NextResponse.json(stall)
  } catch (error) {
    console.error('Error fetching stall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
