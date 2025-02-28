const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function executeCommand(command, ignoreError = false) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`Failed to execute command: ${command}`);
        console.error(error);
        if (!ignoreError) {
            process.exit(1);
        }
        return false;
    }
}

function checkEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.log('Creating .env file with default database URL...');
        const defaultEnvContent = 'DATABASE_URL="postgresql://postgres:5669@localhost:5433/royal_cauvery_farms"\n';
        fs.writeFileSync(envPath, defaultEnvContent);
    }
}

async function cleanPrismaCache() {
    const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');
    if (fs.existsSync(prismaDir)) {
        console.log('Cleaning Prisma cache...');
        fs.rmSync(prismaDir, { recursive: true, force: true });
    }
}

async function main() {
    console.log('🚀 Starting database setup...');
    console.log(`Platform: ${os.platform()}, Architecture: ${os.arch()}`);

    // Check and create .env file if it doesn't exist
    checkEnvFile();

    console.log('📦 Installing dependencies...');
    executeCommand('bun install');

    // Clean Prisma cache first
    await cleanPrismaCache();

    console.log('🔄 Attempting Prisma Client generation...');
    
    // Try different Prisma generate commands
    const commands = [
        'bunx prisma generate',
        'npx prisma generate',
        'node node_modules/prisma/build/index.js generate'
    ];

    let success = false;
    for (const command of commands) {
        console.log(`Trying: ${command}`);
        if (executeCommand(command, true)) {
            success = true;
            break;
        }
        // Wait a bit before trying the next command
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!success) {
        console.error('Failed to generate Prisma Client after multiple attempts');
        process.exit(1);
    }

    console.log('🏗️ Creating database and applying migrations...');
    executeCommand('bunx prisma db push');

    console.log('🌱 Seeding the database...');
    executeCommand('bunx prisma db seed');

    console.log('✅ Database setup completed successfully!');
    console.log('\nYou can now start the application with:');
    console.log('bun dev');
}

main().catch((error) => {
    console.error('Failed to set up database:', error);
    process.exit(1);
});