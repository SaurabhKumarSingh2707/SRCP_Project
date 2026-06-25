const { prisma } = require('../config/prismaClient');
const crypto = require('crypto');

// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const { name, description, projectId } = req.body;
        const student = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
            include: { user: true }
        });

        if (!student) {
            return res.status(403).json({ message: "Only students can create teams" });
        }

        const currentYear = new Date().getFullYear();
        const dept = (student.department || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
        const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
        const generatedTeamCode = `${currentYear}-${dept}-${randomHex}`;

        const team = await prisma.team.create({
            data: {
                teamCode: generatedTeamCode,
                name,
                description,
                projectId: projectId ? projectId : null,
                leaderId: req.user.id,
                members: {
                    create: {
                        userId: req.user.id,
                        isLeader: true,
                        inviteStatus: 'ACCEPTED'
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            include: { studentProfile: true }
                        }
                    }
                },
                project: true
            }
        });

        // Delete pending invites and notify their leaders
        try {
            const studentId = req.user.id;
            const pendingInvites = await prisma.teamMember.findMany({
                where: {
                    userId: studentId,
                    inviteStatus: 'PENDING'
                },
                include: {
                    team: true
                }
            });

            if (pendingInvites.length > 0) {
                // Delete teamMember records and notifications concurrently
                await Promise.all([
                    prisma.teamMember.deleteMany({
                        where: {
                            userId: studentId,
                            inviteStatus: 'PENDING'
                        }
                    }),
                    prisma.notification.deleteMany({
                        where: {
                            userId: studentId,
                            type: 'TEAM_INVITE'
                        }
                    })
                ]);

                // Notify leaders using bulk createMany
                const studentUser = student?.user || await prisma.user.findUnique({ where: { id: studentId } });
                const notificationsData = pendingInvites.map(invite => ({
                    userId: invite.team.leaderId,
                    title: "Team Invitation Declined",
                    message: `${studentUser.fullName} created their own team and declined your invitation.`,
                    type: "TEAM_INVITE_RESPONSE"
                }));
                
                if (notificationsData.length > 0) {
                    await prisma.notification.createMany({ data: notificationsData });
                }
            }
        } catch (cleanupError) {
            console.error("Error during invite cleanup:", cleanupError);
        }

        res.status(201).json(team);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all teams
exports.getTeams = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [teams, total] = await Promise.all([
            prisma.team.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true,
                    leaderId: true,
                    project: { select: { id: true, title: true } },
                    leader: { select: { id: true, fullName: true, profilePhoto: true, studentProfile: { select: { section: true } } } },
                    members: { 
                        select: { 
                            id: true,
                            userId: true, 
                            user: { 
                                select: { 
                                    fullName: true,
                                    studentProfile: { select: { section: true } }
                                } 
                            }
                        } 
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.team.count()
        ]);
        res.json({ teams, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: {
                project: { select: { id: true, title: true, domain: true } },
                leader: { select: { id: true, fullName: true, email: true, registerNumber: true, studentProfile: { select: { department: true, section: true } } } },
                members: { select: { id: true, isLeader: true, inviteStatus: true, user: { select: { id: true, fullName: true, email: true, registerNumber: true, profilePhoto: true, studentProfile: { select: { section: true } } } } } },
                guide: { select: { id: true, fullName: true, facultyProfile: { select: { designation: true, department: true } } } }
            }
        });

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        res.json(team);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Join a team
exports.joinTeam = async (req, res) => {
    try {
        const { role } = req.body;
        const student = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!student) {
            return res.status(403).json({ message: "Only students can join teams" });
        }

        const member = await prisma.teamMember.create({
            data: {
                teamId: req.params.id,
                userId: req.user.id,
                isLeader: false,
                inviteStatus: 'ACCEPTED'
            }
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "You are already a member of this team" });
        }
        res.status(500).json({ message: "Server Error" });
    }
};
