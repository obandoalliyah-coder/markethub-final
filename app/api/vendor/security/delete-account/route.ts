import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    // Ensure the user is logged in
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Completely nuke the User and all associated data via Cascade deletes
    await prisma.user.delete({
      where: { id: (session.user as any).id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
