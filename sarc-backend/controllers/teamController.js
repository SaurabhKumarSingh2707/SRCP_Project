const { prisma } = require('../config/prismaClient');
// Create a new team
exports.createTeam = async (req, res) => {
    try {
        const { name, description, projectId } = req.body;
        const student = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!student) {
            return res.status(403).json({ message: "Only students can create teams" });
        }

        const team = await prisma.team.create({
            data: {
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
                    include: { student: { include: { user: true } } }
                },
                project: true
            }
        });

        res.status(201).json(team);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all teams
exports.getTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                leader: { include: { studentProfile: { select: { department: true } } } },
                members: { include: { user: { select: { fullName: true, studentProfile: { select: { department: true } } } } } },
                project: true
            }
        });
        res.json(teams);
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
                leader: { include: { studentProfile: { select: { department: true } } } },
                members: { include: { user: { select: { fullName: true, studentProfile: { select: { department: true } } } } } },
                project: true
            }
        });
        if (!team) return res.status(404).json({ message: "Team not found" });
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
