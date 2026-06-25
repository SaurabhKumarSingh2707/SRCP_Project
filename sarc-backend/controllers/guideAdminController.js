const { prisma } = require('../config/prismaClient');
const { clearCachePattern } = require('../middleware/cacheMiddleware');
exports.getConfigAndStats = async (req, res) => {
    try {
        let config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config) {
            config = await prisma.guideSelectionConfig.create({ data: { id: 'singleton', phase: 'CLOSED' } });
        }

        const [
            totalTeams,
            teamsMatchedFaculty,
            teamsMatchedStudent,
            unmatchedTeams,
            facultySlots
        ] = await Promise.all([
            prisma.team.count(),
            prisma.team.count({ where: { guideId: { not: null } } }),
            prisma.team.count({ where: { guideId: null, status: 'REQUESTED_GUIDE' } }),
            prisma.team.count({ where: { status: 'FORMING' } }),
            prisma.facultyGuideSlot.findMany({
                include: {
                    faculty: { select: { fullName: true, facultyProfile: { select: { department: true } } } }
                }
            })
        ]);

        const openSlotsFacultyCount = facultySlots.filter(slot => slot.usedSlots < slot.totalSlots).length;

        res.json({
            config,
            stats: {
                totalTeams,
                teamsMatchedFaculty,
                teamsMatchedStudent,
                unmatchedTeams,
                openSlotsFacultyCount
            },
            facultySlots
        });

    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching config' });
    }
};

exports.changePhase = async (req, res) => {
    try {
        const { phase, dropIncompleteTeams } = req.body;
        const validPhases = ['CLOSED', 'FACULTY_SELECTION', 'STUDENT_SELECTION', 'COMPLETED'];

        if (!validPhases.includes(phase)) {
            return res.status(400).json({ message: 'Invalid phase' });
        }

        const currentConfig = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        const oldPhase = currentConfig?.phase;

        await prisma.guideSelectionConfig.upsert({
            where: { id: 'singleton' },
            update: { phase },
            create: { id: 'singleton', phase }
        });

        if (oldPhase && oldPhase !== phase) {
            const now = new Date();
            const pendingOldMilestones = await prisma.globalMilestone.findMany({
                where: {
                    relatedPhase: oldPhase,
                    status: 'PENDING',
                    dueDate: { gt: now }
                }
            });

            if (pendingOldMilestones.length > 0) {
                const nextMilestone = await prisma.globalMilestone.findFirst({
                    where: { relatedPhase: phase },
                    orderBy: { dueDate: 'asc' }
                });

                if (nextMilestone) {
                    await prisma.globalMilestone.updateMany({
                        where: { relatedPhase: oldPhase, status: 'PENDING' },
                        data: {
                            dueDate: nextMilestone.dueDate,
                            status: 'COMPLETED'
                        }
                    });
                } else {
                    await prisma.globalMilestone.updateMany({
                        where: { relatedPhase: oldPhase, status: 'PENDING' },
                        data: {
                            dueDate: now,
                            status: 'COMPLETED'
                        }
                    });
                }
            }
        }

        if (phase === 'FACULTY_SELECTION') {
            // Finalize teams using targeted DB queries to prevent loading all teams in memory
            let teamsToDeleteIds = [];
            let teamsToClearPendingIds = [];

            if (dropIncompleteTeams) {
                const teamsToDelete = await prisma.team.findMany({
                    where: {
                        OR: [
                            { status: 'FORMING' },
                            {
                                status: { not: 'FORMING' },
                                members: { some: { inviteStatus: 'PENDING' } }
                            }
                        ]
                    },
                    select: { id: true }
                });
                teamsToDeleteIds = teamsToDelete.map(t => t.id);
            } else {
                const teamsToClear = await prisma.team.findMany({
                    where: {
                        status: { not: 'FORMING' },
                        members: { some: { inviteStatus: 'PENDING' } }
                    },
                    select: { id: true }
                });
                teamsToClearPendingIds = teamsToClear.map(t => t.id);
            }

            // Bulk operations instead of sequential awaits
            if (teamsToClearPendingIds.length > 0) {
                await prisma.teamMember.deleteMany({
                    where: { teamId: { in: teamsToClearPendingIds }, inviteStatus: 'PENDING' }
                });
            }

            if (teamsToDeleteIds.length > 0) {
                await prisma.teamMember.deleteMany({ where: { teamId: { in: teamsToDeleteIds } } });
                await prisma.team.deleteMany({ where: { id: { in: teamsToDeleteIds } } });
            }
        }

        // Clear cache so the frontend updates immediately
        await clearCachePattern('/api/guide/config');

        res.json({ message: `Phase changed to ${phase}` });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error changing phase' });
    }
};

exports.updateFacultySlot = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { totalSlots } = req.body;
        const newTotal = parseInt(totalSlots);

        const currentSlot = await prisma.facultyGuideSlot.findUnique({
            where: { facultyId: facultyId }
        });

        if (currentSlot && newTotal < currentSlot.usedSlots) {
            return res.status(400).json({
                message: `Cannot set total slots (${newTotal}) below the currently used slots (${currentSlot.usedSlots}).`
            });
        }

        await prisma.facultyGuideSlot.update({
            where: { facultyId: facultyId },
            data: { totalSlots: newTotal }
        });

        await clearCachePattern('/api/guide/config');
        res.json({ message: 'Faculty slot updated successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error updating faculty slot' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            where: {
                guideId: { not: null }
            },
            include: {
                leader: { select: { fullName: true, registerNumber: true, studentProfile: { select: { section: true } } } },
                guide: {
                    select: {
                        fullName: true,
                        facultyProfile: { select: { designation: true, department: true } }
                    }
                },
                members: {
                    where: { inviteStatus: 'ACCEPTED', isLeader: false },
                    include: {
                        user: { 
                            select: { 
                                fullName: true, 
                                registerNumber: true,
                                studentProfile: { select: { section: true } }
                            } 
                        }
                    }
                }
            },
            orderBy: { id: 'asc' }
        });
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching dashboard' });
    }
};

exports.getAllTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                domain: true,
                projectId: true,
                status: true,
                leaderId: true,
                guideId: true,
                selectionSource: true,
                abstractFile: true,
                createdAt: true,
                updatedAt: true,
                leader: {
                    select: {
                        fullName: true,
                        email: true,
                        registerNumber: true,
                        studentProfile: { select: { department: true, section: true } }
                    }
                },
                members: {
                    select: {
                        id: true,
                        teamId: true,
                        userId: true,
                        isLeader: true,
                        inviteStatus: true,
                        joinedAt: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                registerNumber: true,
                                studentProfile: { select: { section: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching all teams' });
    }
};

exports.toggleTeamFinalization = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { isFinalized } = req.body;

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team && team.guideId) {
            return res.status(400).json({ message: 'Cannot change finalization status of a team that already has an assigned guide.' });
        }

        const updatedTeam = await prisma.team.update({
            where: { id: teamId },
            data: { status: isFinalized ? 'REQUESTED_GUIDE' : 'FORMING' }
        });

        res.json({ message: `Team finalization set to ${isFinalized}`, team: updatedTeam });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error toggling team finalization' });
    }
};

exports.finalizeAllTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { members: true }
        });

        const teamIdsToUpdate = [];
        for (const team of teams) {
            const acceptedCount = team.members.filter(m => m.inviteStatus === 'ACCEPTED').length;
            // Only finalize teams with 1 or 2 accepted members
            if (acceptedCount >= 1 && acceptedCount <= 2 && team.status === 'FORMING') {
                teamIdsToUpdate.push(team.id);
            }
        }

        let finalizedCount = teamIdsToUpdate.length;
        if (finalizedCount > 0) {
            await prisma.team.updateMany({
                where: { id: { in: teamIdsToUpdate } },
                data: { status: 'REQUESTED_GUIDE' }
            });
        }

        res.json({ message: `Successfully finalized ${finalizedCount} ready teams.` });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error finalizing all teams' });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        await prisma.$transaction(async (tx) => {
            const team = await tx.team.findUnique({ where: { id: teamId } });
            if (team && team.guideId) {
                await tx.facultyGuideSlot.update({
                    where: { facultyId: team.guideId },
                    data: { usedSlots: { decrement: 1 } }
                });
            }

            await tx.teamMember.deleteMany({ where: { teamId } });

            await tx.team.delete({ where: { id: teamId } });
        });

        res.json({ message: 'Team successfully deleted.' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error deleting team' });
    }
};

exports.resetPhase = async (req, res) => {
    try {
        // Delete ALL Teams (TeamMembers will cascade delete automatically)
        await prisma.team.deleteMany({});

        // Reset all faculty guide slots' used count back to 0
        await prisma.facultyGuideSlot.updateMany({
            data: { usedSlots: 0 }
        });

        // Reset phase to CLOSED
        await prisma.guideSelectionConfig.upsert({
            where: { id: 'singleton' },
            update: { phase: 'CLOSED' },
            create: { id: 'singleton', phase: 'CLOSED' }
        });

        await clearCachePattern('/api/guide/config');
        res.json({ message: 'Guide Selection phase has been completely restarted. All data wiped.' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error resetting phase' });
    }
};

exports.exportTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            where: {
                guideId: { not: null }
            },
            include: {
                leader: { select: { fullName: true, registerNumber: true, studentProfile: { select: { section: true } } } },
                guide: { select: { fullName: true, facultyProfile: { select: { department: true } } } },
                members: {
                    where: { inviteStatus: 'ACCEPTED', isLeader: false },
                    include: {
                        user: { 
                            select: { 
                                fullName: true, 
                                registerNumber: true,
                                studentProfile: { select: { section: true } }
                            } 
                        }
                    }
                }
            },
            orderBy: { id: 'asc' }
        });

        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error exporting teams' });
    }
};

exports.removeMemberFromTeam = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId
                }
            },
            include: { team: true }
        });

        if (!teamMember) {
            return res.status(404).json({ message: 'Member not found in this team.' });
        }

        if (teamMember.isLeader || teamMember.team.leaderId === userId) {
            return res.status(400).json({ message: 'Cannot remove the team leader. Please delete the entire team instead.' });
        }

        await prisma.teamMember.delete({
            where: { id: teamMember.id }
        });

        res.json({ message: 'Student successfully removed from the team and is now unassigned.' });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: 'Server error removing member' });
    }
};

exports.assignStudentToTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { studentId } = req.body;

        // Verify team exists and is not forming (or maybe it is forming? Single member team means FORMING or whatever, just verify it exists)
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Ensure team doesn't exceed 2 members
        const acceptedMembersCount = team.members.filter(m => m.inviteStatus === 'ACCEPTED').length;
        if (acceptedMembersCount >= 2) {
            return res.status(400).json({ message: 'Team is already full' });
        }

        // Verify student exists and is unassigned
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: { teamMemberships: { where: { inviteStatus: 'ACCEPTED' } } }
        });

        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.teamMemberships.length > 0) return res.status(400).json({ message: 'Student is already in a team' });

        // Add to team as ACCEPTED
        await prisma.teamMember.create({
            data: {
                teamId,
                userId: studentId,
                isLeader: false,
                inviteStatus: 'ACCEPTED'
            }
        });

        res.json({ message: 'Student successfully assigned to the team.' });
    } catch (error) {
        console.error("Error assigning student to team:", error);
        res.status(500).json({ message: 'Server error assigning student to team' });
    }
};
