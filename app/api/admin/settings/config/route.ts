import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const config = await prisma.systemSetting.findUnique({
      where: { id: 'global' },
    })
    
    if (!config) {
      // Create defaults if they don't exist
      const newConfig = await prisma.systemSetting.create({
        data: {
          id: 'global',
          gracePeriodDays: 5,
          lateFeePercentage: 2,
          baseRateVegetable: 1500,
        }
      })
      return NextResponse.json(newConfig)
    }

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve configuration' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { gracePeriodDays, lateFeePercentage, baseRateVegetable } = body

    const config = await prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: {
        gracePeriodDays,
        lateFeePercentage,
        baseRateVegetable,
      },
      create: {
        id: 'global',
        gracePeriodDays: gracePeriodDays || 5,
        lateFeePercentage: lateFeePercentage || 2,
        baseRateVegetable: baseRateVegetable || 1500,
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}
