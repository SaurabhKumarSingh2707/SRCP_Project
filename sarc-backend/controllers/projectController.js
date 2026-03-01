const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/projects
// @desc    Get all projects
// @access  Public
// Fetch all projects and include the faculty name and department so the frontend can display it easily
exports.getProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                faculty: {
                    select: {
                        fullName: true,
                        department: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Public
exports.getProjectById = async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                faculty: {
                    select: { fullName: true, email: true }
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/projects
// @desc    Create a new project
// @access  Private (Faculty/Admin only)
exports.createProject = async (req, res) => {
    try {
        // Ensure user is faculty or admin
        if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to create projects' });
        }

        const { title, description, skillsRequired, deadline } = req.body;

        const newProject = await prisma.project.create({
            data: {
                title,
                description,
                skillsRequired,
                deadline: deadline ? new Date(deadline) : null,
                facultyId: req.user.id
            }
        });

        res.status(201).json(newProject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
