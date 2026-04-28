import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: vendorId } = await params

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    // Generate a temporary 10-character password
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    await prisma.user.update({
      where: { id: vendor.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ tempPassword })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
