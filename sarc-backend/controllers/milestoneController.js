const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create milestone (Faculty only)
exports.createMilestone = async (req, res) => {
    try {
        const { title, description, dueDate, projectId } = req.body;
        const faculty = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.userId }
        });

        if (!faculty) {
            return res.status(403).json({ message: "Only faculty can create milestones" });
        }

        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) }
        });

        if (!project || project.facultyId !== faculty.id) {
            return res.status(403).json({ message: "You can only create milestones for your own projects" });
        }

        const milestone = await prisma.milestone.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                projectId: parseInt(projectId)
            }
        });

        res.status(201).json(milestone);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get milestones for a project
exports.getMilestones = async (req, res) => {
    try {
        const milestones = await prisma.milestone.findMany({
            where: { projectId: parseInt(req.params.projectId) },
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
        const { status, submissionNotes } = req.body;
        const updateData = { status };
        
        if (submissionNotes) updateData.submissionNotes = submissionNotes;
        if (req.file) updateData.submissionFile = req.file.filename;
        if (status === 'SUBMITTED') updateData.submittedAt = new Date();

        const milestone = await prisma.milestone.update({
            where: { id: parseInt(req.params.id) },
            data: updateData
        });
        res.json(milestone);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
