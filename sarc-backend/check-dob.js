const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDob() {
    const student = await prisma.user.findFirst({
        where: { email: 'saurabhkumarsingh2707@gmail.com' },
        select: { email: true, dateOfBirth: true }
    });

    console.log("DB value:", JSON.stringify(student, null, 2));
    await prisma.$disconnect();
}

checkDob();
