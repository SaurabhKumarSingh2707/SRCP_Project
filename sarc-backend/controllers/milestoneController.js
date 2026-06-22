const { prisma } = require('../config/prismaClient');
// Create milestone (Faculty only)
exports.createMilestone = async (req, res) => {
    try {
        const { title, description, dueDate, projectId } = req.body;
        const faculty = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!faculty) {
            return res.status(403).json({ message: "Only faculty can create milestones" });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project || project.facultyId !== faculty.id) {
            return res.status(403).json({ message: "You can only create milestones for your own projects" });
        }

        const milestone = await prisma.milestone.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                projectId: projectId
            }
        });

        res.status(201).json(milestone);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get milestones for a project
exports.getMilestones = async (req, res) => {
    try {
        const milestones = await prisma.milestone.findMany({
            where: { projectId: req.params.projectId },
            orderBy: { dueDate: 'asc' }
        });
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Update milestone status (Student submits, Faculty reviews)
exports.updateMilestone = async (req, res) => {
    try {
        const milestoneId = req.params.id;
        const { status, submissionNotes } = req.body;
        
        // 1. Fetch milestone with project and teams to check authorization
        const milestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                project: {
                    include: {
                        teams: {
                            include: { members: true }
                        }
                    }
                }
            }
        });

        if (!milestone) return res.status(404).json({ message: "Milestone not found" });

        // 2. Authorization Check
        let isAuthorized = false;
        const userRole = req.user.role;
        const userId = req.user.id;

        if (userRole === 'ADMIN') {
            isAuthorized = true;
        } else if (userRole === 'FACULTY') {
            const faculty = await prisma.facultyProfile.findUnique({ where: { userId } });
            if (faculty && milestone.project.facultyId === faculty.id) {
                isAuthorized = true;
            }
        } else if (userRole === 'STUDENT') {
            const inTeam = milestone.project.teams.some(team => 
                team.leaderId === userId || team.members.some(m => m.userId === userId)
            );
            if (inTeam) isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "Not authorized to update this milestone" });
        }

        // 3. Update Data
        const updateData = { status };
        
        if (submissionNotes) updateData.submissionNotes = submissionNotes;
        if (req.body.submissionFile) updateData.submissionFile = req.body.submissionFile;
        if (status === 'SUBMITTED') updateData.submittedAt = new Date();

        const updatedMilestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data: updateData
        });
        res.json(updatedMilestone);
    } catch (error) {
        console.error("Error updating milestone:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
