const { prisma } = require('./config/prismaClient');

async function setup() {
    try {
        // 1. Set guide selection phase to CLOSED to enable student team creation
        await prisma.guideSelectionConfig.upsert({
            where: { id: 'singleton' },
            update: { phase: 'CLOSED' },
            create: { id: 'singleton', phase: 'CLOSED' }
        });
        console.log('Database phase configured to: CLOSED');

        // 2. Clean up E2E test records in dependency order to prevent FK violations
        // Find E2E test users
        const e2eUsers = await prisma.user.findMany({
            where: {
                email: {
                    contains: 'e2e-'
                }
            },
            select: { id: true }
        });

        const userIds = e2eUsers.map(u => u.id);

        if (userIds.length > 0) {
            // Delete GuideTeamMembers associated with E2E users
            await prisma.guideTeamMember.deleteMany({
                where: {
                    studentId: { in: userIds }
                }
            });

            // Delete GuideTeams led by E2E users
            await prisma.guideTeam.deleteMany({
                where: {
                    leaderId: { in: userIds }
                }
            });

            // Delete normal TeamMembers associated with E2E users
            await prisma.teamMember.deleteMany({
                where: {
                    student: { userId: { in: userIds } }
                }
            });

            // Delete normal Teams led by E2E users
            await prisma.team.deleteMany({
                where: {
                    leader: { userId: { in: userIds } }
                }
            });

            // Delete StudentProfiles, FacultyProfiles, and IndustryProfiles
            await prisma.studentProfile.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.facultyProfile.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.industryProfile.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.adminProfile.deleteMany({ where: { userId: { in: userIds } } });

            // Finally, delete the Users
            const deletedUsers = await prisma.user.deleteMany({
                where: {
                    id: { in: userIds }
                }
            });
            console.log(`Cleaned up ${deletedUsers.count} old E2E test users and associated profiles/teams.`);
        } else {
            console.log('No old E2E test users to clean up.');
        }

    } catch (err) {
        console.error('Database setup failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

setup();
