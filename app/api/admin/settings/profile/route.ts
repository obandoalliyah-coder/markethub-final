import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, currentPassword } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email

    if (password && password.trim() !== '') {
      // Verify current password first
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user?.password) {
        return NextResponse.json({ error: 'No password set on this account.' }, { status: 400 })
      }
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required.' }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin profile' }, { status: 500 })
  }
}