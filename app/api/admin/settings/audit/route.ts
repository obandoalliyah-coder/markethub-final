import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const ghostRecords = []

    // 1. Stalls marked OCCUPIED but not occupiedBy any active Vendor
    const ghostStalls = await prisma.stall.findMany({
      where: {
        status: 'OCCUPIED',
        occupiedBy: null
      }
    })

    for (const stall of ghostStalls) {
      ghostRecords.push({
        id: `stall_ghost_${stall.id}`,
        type: 'ORPHAN_STALL',
        targetId: stall.id,
        issue: 'Stall marked OCCUPIED but has no active Vendor assigned.',
        stall: stall.stallNumber
      })
    }
    
    // 2. Vendors marked APPROVED but actually have a SUSPENDED or missing User account
    const ghostVendors = await prisma.vendorProfile.findMany({
      where: {
        status: 'APPROVED',
        user: {
          is: null // Meaning User was deleted somehow, but cascading failed?
        }
      }
    })

    for (const profile of ghostVendors) {
       ghostRecords.push({
         id: `vendor_ghost_${profile.id}`,
         type: 'ORPHAN_VENDOR',
         targetId: profile.id,
         issue: 'Vendor profile exists and APPROVED, but parent login is missing.',
         vendor: profile.businessName
       })
    }

    return NextResponse.json(ghostRecords)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to run system audit' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, targetId } = body

    if (type === 'ORPHAN_STALL') {
       await prisma.stall.update({
          where: { id: targetId },
          data: { status: 'AVAILABLE', occupiedBy: null, occupationDate: null }
       })
       return NextResponse.json({ message: 'Stall freed.' })
    } 
    else if (type === 'ORPHAN_VENDOR') {
       await prisma.vendorProfile.delete({
          where: { id: targetId }
       })
       return NextResponse.json({ message: 'Ghost vendor profile deleted.' })
    }

    return NextResponse.json({ error: 'Unknown issue type' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Auto-fix failed' }, { status: 500 })
  }
}
