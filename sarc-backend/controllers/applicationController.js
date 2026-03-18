const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.applyForProject = async (req, res) => {
    try {
        const { projectId, message } = req.body;

        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!studentProfile) {
            return res.status(403).json({ message: 'Only students can apply' });
        }

        const studentId = studentProfile.id;

        // Check if already applied
        const existingApp = await prisma.application.findFirst({
            where: { studentId, projectId: parseInt(projectId) }
        });

        if (existingApp) {
            return res.status(400).json({ message: 'You have already applied for this project' });
        }

        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { faculty: { include: { user: true } } }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const resumeFile = req.file ? req.file.filename : studentProfile.resumeFile;

        // 1. Create Application
        const application = await prisma.application.create({
            data: {
                studentId,
                projectId: parseInt(projectId),
                message,
                resumeFile,
                status: 'PENDING'
            }
        });

        // 2. Notify Faculty
        await prisma.notification.create({
            data: {
                userId: project.faculty.userId,
                type: 'APPLICATION_SUBMITTED',
                message: `New student application for your project: ${project.title}`,
                link: `/faculty` // Optional direct link (adjust based on frontend routes)
            }
        });

        res.status(201).json({ message: 'Applied successfully', application });
    } catch (error) {
        console.error("Apply error:", error);
        res.status(500).json({ message: 'Server error applying for project' });
    }
};

exports.getStudentApplications = async (req, res) => {
    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (!studentProfile) return res.status(403).json({ message: 'Only students can access this' });
        const studentId = studentProfile.id;

        const apps = await prisma.application.findMany({
            where: { studentId },
            include: {
                project: {
                    include: { faculty: { include: { user: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(apps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching applications' });
    }
};

exports.getFacultyApplications = async (req, res) => {
    try {
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (!facultyProfile) return res.status(403).json({ message: 'Only faculty can access this' });
        const facultyId = facultyProfile.id;

        const apps = await prisma.application.findMany({
            where: {
                project: { facultyId }
            },
            include: {
                student: { include: { user: true } },
                project: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(apps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching applications' });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = parseInt(req.params.id);
        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!facultyProfile) return res.status(403).json({ message: 'Unauthorized' });
        const facultyId = facultyProfile.id;

        // Ensure this faculty owns the project
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                project: true,
                student: { include: { user: true } }
            }
        });

        if (!application || application.project.facultyId !== facultyId) {
            return res.status(403).json({ message: 'Not authorized or application not found' });
        }

        const updatedApp = await prisma.application.update({
            where: { id: applicationId },
            data: { status }
        });

        // Notify Student
        let message = `Your application for '${application.project.title}' status changed to ${status}`;
        if (status === 'ACCEPTED') message = `Congratulations! You have been accepted for the project '${application.project.title}'.`;
        if (status === 'REJECTED') message = `Your application for '${application.project.title}' was not advanced this time.`;
        if (status === 'SHORTLISTED') message = `You have been shortlisted for '${application.project.title}'.`;

        await prisma.notification.create({
            data: {
                userId: application.student.userId,
                type: 'STATUS_UPDATE',
                message,
                link: `/student/projects` // Adjust to their applications page if needed
            }
        });

        res.json({ message: 'Status updated', application: updatedApp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating status' });
    }
};
