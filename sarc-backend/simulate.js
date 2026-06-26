const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function simulateUpload() {
    const users = [
        {
            fullName: "mukesh",
            email: "staff4@gmail.com",
            role: "FACULTY",
            department: "CSE",
            employeeId: "EMP04"
        }
    ];

    const emails = users.map(u => String(u.email).trim()).filter(Boolean);
    const regNumbers = users.map(u => u.studentId ? String(u.studentId).trim() : null).filter(Boolean);

    const existingUsers = await prisma.user.findMany({
        where: { OR: [ { email: { in: emails } }, { registerNumber: { in: regNumbers } } ] },
        select: { id: true, email: true, registerNumber: true }
    });
    
    const existingUsersByEmail = new Map(existingUsers.map(u => [u.email, u.id]));
    const existingUsersByReg = new Map(existingUsers.map(u => [u.registerNumber, u.id]));

    let validUsers = users;
    
    const usersToInsert = [];
    const facultyProfiles = [];
    const facultyGuideSlots = [];

    for (const u of validUsers) {
        const email = String(u.email).trim();
        const studentId = u.studentId ? String(u.studentId).trim() : null;
        let userId = existingUsersByEmail.get(email) || (studentId ? existingUsersByReg.get(studentId) : null);

        if (!userId) {
            userId = crypto.randomUUID();
            const hashedPassword = await bcrypt.hash("pass", 4);
            const prismaRole = u.role ? String(u.role).toUpperCase() : 'STUDENT';
            
            usersToInsert.push({
                id: userId,
                fullName: String(u.fullName),
                email: email,
                registerNumber: studentId,
                password: hashedPassword,
                role: prismaRole
            });
        }

        const prismaRole = u.role ? String(u.role).toUpperCase() : 'STUDENT';
        if (prismaRole === 'FACULTY') {
            facultyProfiles.push({ 
                userId: userId, 
                department: u.department ? String(u.department) : null, 
                employeeId: u.employeeId ? String(u.employeeId) : null
            });
            facultyGuideSlots.push({ facultyId: userId, totalSlots: 7, usedSlots: 0 });
        }
    }

    console.log("To Insert Users:", usersToInsert);
    console.log("To Insert Profiles:", facultyProfiles);

    try {
        await prisma.$transaction([
            ...(usersToInsert.length > 0 ? [prisma.user.createMany({ data: usersToInsert, skipDuplicates: true })] : []),
            ...(facultyProfiles.length > 0 ? [prisma.facultyProfile.createMany({ data: facultyProfiles, skipDuplicates: true })] : []),
            ...(facultyGuideSlots.length > 0 ? [prisma.facultyGuideSlot.createMany({ data: facultyGuideSlots, skipDuplicates: true })] : []),
        ]);
        console.log("Success!");
    } catch(e) {
        console.error("Failed:", e);
    }
}
simulateUpload().finally(() => prisma.$disconnect());
