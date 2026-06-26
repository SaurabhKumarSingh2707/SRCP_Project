const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({ where: { role: 'FACULTY' } });
    console.log("Users:", users.length, users.map(u => u.email));
    const profiles = await prisma.facultyProfile.findMany();
    console.log("Profiles:", profiles.length, profiles);
}

check().then(() => prisma.$disconnect());
