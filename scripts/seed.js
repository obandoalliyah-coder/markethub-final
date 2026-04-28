const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing database...')
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.stallApplication.deleteMany()
  await prisma.vendorProfile.deleteMany()
  await prisma.stall.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Admin
  await prisma.user.create({
    data: {
      email: 'admin@markethub.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
    }
  })

  // Create Stalls
  const stalls = []
  for (let i = 1; i <= 10; i++) {
    stalls.push(await prisma.stall.create({
      data: {
        stallNumber: `A-${i.toString().padStart(2, '0')}`,
        location: 'Main Building',
        size: '2x2',
        monthlyRate: 2000,
        status: i <= 5 ? 'OCCUPIED' : 'AVAILABLE',
        productType: i <= 5 ? JSON.stringify(['Meat & Seafood']) : JSON.stringify(['Vegetables & Fruits']),
      }
    }))
  }

  // Create Vendors
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `vendor${i}@markethub.com`,
        password: hashedPassword,
        name: `Vendor ${i}`,
        role: 'VENDOR',
      }
    })

    const profile = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: `Vendor ${i} Meat Shop`,
        businessType: 'Meat & Seafood',
        ownerName: `Vendor ${i}`,
        contactNumber: `0912345678${i}`,
        address: 'Poblacion',
        barangay: 'Poblacion',
        municipality: 'Boac',
        province: 'Marinduque',
        zipCode: '4900',
        status: 'APPROVED',
      }
    })

    const stall = stalls[i - 1]

    const application = await prisma.stallApplication.create({
      data: {
        vendorId: profile.id,
        stallId: stall.id,
        status: 'APPROVED',
        applicationType: 'NEW',
        contractStart: new Date(),
        contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      }
    })

    await prisma.payment.create({
      data: {
        vendorId: profile.id,
        stallId: stall.id,
        applicationId: application.id,
        amount: 2000,
        dueDate: new Date(),
        paidDate: new Date(),
        status: 'VERIFIED',
        paymentType: 'MONTHLY',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      }
    })
    
    // Add an overdue payment
    await prisma.payment.create({
      data: {
        vendorId: profile.id,
        stallId: stall.id,
        applicationId: application.id,
        amount: 2000,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        status: 'OVERDUE',
        paymentType: 'MONTHLY',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      }
    })
  }

  console.log('Seeding complete!')
  console.log('Admin Email: admin@markethub.com | Password: password123')
  console.log('Vendor Email: vendor1@markethub.com | Password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
