const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDob() {
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { email: true, dateOfBirth: true },
        take: 5
    });

    console.log("Sample Students from DB:");
    console.log(JSON.stringify(students, null, 2));
    await prisma.$disconnect();
}

checkDob();
