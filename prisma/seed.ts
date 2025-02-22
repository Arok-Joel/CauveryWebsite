import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('Admin credentials not configured in environment variables')
  }

  // Create admin user if it doesn't exist
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: adminEmail,
      role: 'ADMIN',
    },
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        password: adminPassword,
        phone: '0000000000',
        role: 'ADMIN',
      },
    })
    console.log('Admin user created successfully')
  } else {
    console.log('Admin user already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 