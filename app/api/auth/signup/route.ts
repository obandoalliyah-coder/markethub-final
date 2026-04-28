import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      businessName,
      businessType,
      ownerName,
      contactNumber,
      address,
      barangay,
      municipality,
      province,
      zipCode,
    } = body

    if (
      !email || !password || !name || !businessName ||
      !businessType || !ownerName || !contactNumber ||
      !address || !barangay || !municipality || !province || !zipCode
    ) {
      return NextResponse.json(
        { error: 'All required fields must be filled.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: contactNumber,
        role: 'VENDOR',
        vendorProfile: {
          create: {
            businessName,
            businessType,
            ownerName,
            contactNumber,
            address,
            barangay,
            municipality,
            province,
            zipCode,
            status: 'PENDING',
          },
        },
      },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json(
      { message: 'Account created successfully.', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error during signup:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}