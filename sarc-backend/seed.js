const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with default Admin and Faculty...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sathyabama.ac.in' },
        update: {},
        create: {
            fullName: 'System Administrator',
            email: 'admin@sathyabama.ac.in',
            password: hashedPassword,
            role: 'ADMIN',
            accountStatus: 'ACTIVE',
            adminProfile: {
                create: {
                    department: 'Central Administration'
                }
            }
        }
    });
    console.log('Admin account created: admin@sathyabama.ac.in / password123');

    // Create Faculty
    const faculty = await prisma.user.upsert({
        where: { email: 'faculty@sathyabama.ac.in' },
        update: {},
        create: {
            fullName: 'Dr. Faculty Member',
            email: 'faculty@sathyabama.ac.in',
            password: hashedPassword,
            role: 'FACULTY',
            accountStatus: 'ACTIVE',
            facultyProfile: {
                create: {
                    employeeId: 'F12345',
                    department: 'Computer Science',
                    designation: 'Professor'
                }
            }
        }
    });
    console.log('Faculty account created: faculty@sathyabama.ac.in / password123');

    // Create Real User
    const realHashedPassword = await bcrypt.hash('Guideselection@2023', 10);
    const realUser = await prisma.user.upsert({
        where: { email: 'guideselection.cse@sathyabama.ac.in' },
        update: {},
        create: {
            fullName: 'Guide Selection Admin',
            email: 'guideselection.cse@sathyabama.ac.in',
            password: realHashedPassword,
            role: 'ADMIN',
            accountStatus: 'ACTIVE',
            adminProfile: {
                create: {
                    department: 'Computer Science'
                }
            }
        }
    });
    console.log('Real account created: guideselection.cse@sathyabama.ac.in');

    // Create Student
    const student = await prisma.user.upsert({
        where: { registerNumber: '41150001' },
        update: {},
        create: {
            fullName: 'Test Student',
            registerNumber: '41150001',
            dateOfBirth: new Date('2002-05-15T00:00:00.000Z'),
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            studentProfile: {
                create: {
                    department: 'Computer Science',
                    batch: '2021-2025'
                }
            }
        }
    });
    console.log('Student account created: RegNo: 41150001 / DOB: 05-15-2002');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
