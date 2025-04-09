import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking for existing admin contact info...');
    
    // Check if admin contact info already exists
    const existingContactInfo = await prisma.adminContactInfo.findFirst();
    
    if (existingContactInfo) {
      console.log('Admin contact info already exists. No changes made.');
      return;
    }
    
    console.log('Creating default admin contact info...');
    
    // Create admin contact info with default values
    const adminContactInfo = await prisma.adminContactInfo.create({
      data: {
        address: "117, 5th Street\nIndian Bank Colony\nK K Nagar\nTiruchirappalli - 620021\nTamil Nadu, India",
        email: "info@royalcauveryfarms.com",
        phoneNumbers: {
          create: [
            { number: "+91 98765 43210", isDefault: true },
            { number: "+91 98765 43211", isDefault: false }
          ]
        }
      },
      include: {
        phoneNumbers: true
      }
    });
    
    console.log('Admin contact info created successfully:');
    console.log('ID:', adminContactInfo.id);
    console.log('Email:', adminContactInfo.email);
    console.log('Phone numbers:', adminContactInfo.phoneNumbers.length);
    
  } catch (error) {
    console.error('Error initializing admin contact info:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  }); 