const { prisma } = require('../config/prismaClient');
exports.getFinalizedTeams = async (req, res) => {
    try {
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'FACULTY_SELECTION') {
             return res.json([]);
        }

        const teams = await prisma.team.findMany({
            where: {
                status: 'REQUESTED_GUIDE'
            },
            include: {
                leader: { select: { id: true, fullName: true, email: true } },
                members: {
                    where: { inviteStatus: 'ACCEPTED' },
                    include: { 
                        user: { 
                            select: { 
                                id: true, 
                                fullName: true, 
                                email: true,
                                registerNumber: true,
                                studentProfile: true
                            } 
                        } 
                    }
                }
            }
        });
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching finalized teams' });
    }
};

exports.selectTeams = async (req, res) => {
    try {
        const { teamIds } = req.body;
        const facultyId = req.user.id;

        const facultySlot = await prisma.facultyGuideSlot.findUnique({ where: { facultyId: facultyId } });
        const maxSlots = facultySlot ? facultySlot.totalSlots : 7;

        if (!Array.isArray(teamIds) || teamIds.length === 0 || teamIds.length > maxSlots) {
            return res.status(400).json({ message: `You must select between 1 and ${maxSlots} teams.` });
        }

        // Check phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'FACULTY_SELECTION') {
             return res.status(400).json({ message: 'Faculty selection phase is not active.' });
        }

        // 1. Verify faculty has selected <= maxSlots teams total
        const currentSelectionsCount = await prisma.team.count({
            where: {
                guideId: facultyId,
                status: 'APPROVED'
            }
        });

        if (currentSelectionsCount + teamIds.length > maxSlots) {
            return res.status(400).json({ message: `You can only select up to ${maxSlots} teams. You have already selected ${currentSelectionsCount}.` });
        }

        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

        // 2. Process each teamId
        for (const teamId of teamIds) {
            const team = await prisma.team.findUnique({ where: { id: teamId } });
            if (!team || team.status !== 'REQUESTED_GUIDE') {
                return res.status(400).json({ message: `Team ${teamId} is either not finalized or already matched/selected.` });
            }

            await prisma.$transaction(async (tx) => {
                await tx.team.update({
                    where: { id: team.id },
                    data: { 
                        guideId: facultyId,
                        status: 'APPROVED',
                        selectionSource: 'FACULTY'
                    }
                });

                await tx.facultyGuideSlot.update({
                    where: { facultyId: facultyId },
                    data: { usedSlots: { increment: 1 } }
                });
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Guide Assigned",
                    message: `Prof. ${faculty.fullName} has selected your team "${team.name}" and has been assigned as your guide.`,
                    type: "GUIDE_ASSIGNED",
                    link: JSON.stringify({ teamId: team.id, facultyId })
                }
            });
        }

        res.status(200).json({ message: 'Teams selected successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error selecting teams' });
    }
};

exports.getMySelections = async (req, res) => {
    try {
        const facultyId = req.user.id;

        const teams = await prisma.team.findMany({
            where: { 
                guideId: facultyId, 
                status: 'APPROVED',
                selectionSource: 'FACULTY' 
            },
            include: {
                leader: true,
                members: {
                    where: { inviteStatus: 'ACCEPTED' },
                    include: { user: true }
                }
            }
        });

        const selections = teams.map(team => ({
            team,
            status: 'ACCEPTED'
        }));

        res.json(selections);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching selections' });
    }
};

exports.getAllocatedTeams = async (req, res) => {
    try {
        const facultyId = req.user.id;

        const allocatedTeams = await prisma.team.findMany({
            where: {
                guideId: facultyId,
                status: 'APPROVED'
            },
            include: {
                leader: { select: { fullName: true, email: true, registerNumber: true } },
                members: {
                    where: { inviteStatus: 'ACCEPTED' },
                    include: {
                        user: { select: { fullName: true, email: true, registerNumber: true } }
                    }
                }
            }
        });

        res.json(allocatedTeams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching allocated teams' });
    }
};
