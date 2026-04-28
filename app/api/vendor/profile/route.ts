import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(null)
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      businessName,
      businessType,
      ownerName,
      contactNumber,
      alternateContactNumber,
      address,
      barangay,
      municipality,
      province,
      zipCode,
      businessPermitNumber,
      tinNumber,
      profileImage
    } = body

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: session.user.id,
        businessName,
        businessType,
        ownerName,
        contactNumber,
        alternateContactNumber,
        address,
        barangay,
        municipality,
        province,
        zipCode,
        businessPermitNumber,
        tinNumber,
        profileImage,
        status: 'PENDING',
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      businessName,
      businessType,
      ownerName,
      contactNumber,
      alternateContactNumber,
      address,
      barangay,
      municipality,
      province,
      zipCode,
      businessPermitNumber,
      tinNumber,
      profileImage,
    } = body

    const profile = await prisma.vendorProfile.update({
      where: { userId: session.user.id },
      data: {
        businessName,
        businessType,
        ownerName,
        contactNumber,
        alternateContactNumber,
        address,
        barangay,
        municipality,
        province,
        zipCode,
        businessPermitNumber,
        tinNumber,
        profileImage,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
