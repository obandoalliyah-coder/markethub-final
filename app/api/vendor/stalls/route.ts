import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
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