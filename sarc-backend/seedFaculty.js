const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedFaculty() {
    try {
        console.log("Seeding dummy faculty data...");
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const dummyFaculties = [
            {
                fullName: "Dr. Alan Turing",
                email: "alan.turing@university.edu",
                department: "Computer Science",
                researchAreas: ["Artificial Intelligence", "Cryptography", "Theoretical CS"],
                totalSlots: 5
            },
            {
                fullName: "Dr. Marie Curie",
                email: "marie.curie@university.edu",
                department: "Physics",
                researchAreas: ["Radiation", "Quantum Mechanics", "Materials Science"],
                totalSlots: 6
            },
            {
                fullName: "Dr. Ada Lovelace",
                email: "ada.lovelace@university.edu",
                department: "Computer Science",
                researchAreas: ["Algorithms", "Software Engineering", "Mathematics"],
                totalSlots: 4
            },
            {
                fullName: "Dr. Richard Feynman",
                email: "richard.feynman@university.edu",
                department: "Physics",
                researchAreas: ["Quantum Electrodynamics", "Particle Physics", "Nanotechnology"],
                totalSlots: 7
            },
            {
                fullName: "Dr. Grace Hopper",
                email: "grace.hopper@university.edu",
                department: "Computer Science",
                researchAreas: ["Compilers", "Programming Languages", "Systems"],
                totalSlots: 8
            }
        ];

        for (const fac of dummyFaculties) {
            // Check if already exists
            const existing = await prisma.user.findUnique({ where: { email: fac.email } });
            if (existing) {
                console.log(`Faculty ${fac.fullName} already exists. Skipping.`);
                continue;
            }

            // Create user, profile, and slot
            await prisma.user.create({
                data: {
                    fullName: fac.fullName,
                    email: fac.email,
                    password: hashedPassword,
                    role: 'FACULTY',
                    accountStatus: 'ACTIVE',
                    facultyProfile: {
                        create: {
                            department: fac.department,
                            researchAreas: fac.researchAreas,
                            designation: "Professor",
                            yearsOfExperience: Math.floor(Math.random() * 20) + 5
                        }
                    },
                    facultyGuideSlot: {
                        create: {
                            totalSlots: fac.totalSlots,
                            usedSlots: 0
                        }
                    }
                }
            });
            console.log(`Created faculty: ${fac.fullName}`);
        }

        console.log("Seeding complete!");
    } catch (error) {
        console.error("Error seeding faculty:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedFaculty();
