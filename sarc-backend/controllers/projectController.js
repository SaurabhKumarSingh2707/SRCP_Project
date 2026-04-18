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
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedProjects = projects.map(p => ({
            ...p,
            faculty: {
                id: p.faculty.id,
                fullName: p.faculty.user?.fullName,
                email: p.faculty.user?.email,
                department: p.faculty.department,
                designation: p.faculty.designation
            }
        }));

        res.json(formattedProjects);
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
                    include: {
                        user: {
                            select: { fullName: true, email: true }
                        }
                    }
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        const formattedProject = {
            ...project,
            faculty: {
                id: project.faculty.id,
                fullName: project.faculty.user?.fullName,
                email: project.faculty.user?.email,
                department: project.faculty.department,
                designation: project.faculty.designation
            }
        };

        res.json(formattedProject);
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
        console.log("createProject POST received by user:", req.user.id);
        // Ensure user is faculty or admin
        if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
            console.log("Not auth to create project", req.user.role);
            return res.status(403).json({ message: 'Not authorized to create projects' });
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!facultyProfile) {
            console.log("Faculty profile not found for user", req.user.id);
            return res.status(400).json({ message: 'Faculty profile not found' });
        }

        const {
            title, description, skillsRequired, deadline,
            domain, problemStatement, technologies, expectedOutcome, numberOfStudents
        } = req.body;

        const parseArray = (val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : undefined; }
        };

        const parsedSkills = parseArray(skillsRequired) || [];
        const parsedTechnologies = parseArray(technologies) || [];

        // Files from multer
        const proposalFile = req.files && req.files['proposalFile'] ? req.files['proposalFile'][0].filename : undefined;
        const documentationFile = req.files && req.files['documentationFile'] ? req.files['documentationFile'][0].filename : undefined;
        const demoFile = req.files && req.files['demoFile'] ? req.files['demoFile'][0].filename : undefined;
        const imageFiles = req.files && req.files['imageFiles'] ? req.files['imageFiles'].map(f => f.filename) : [];

        const newProject = await prisma.project.create({
            data: {
                title,
                description,
                skillsRequired: parsedSkills,
                deadline: deadline ? new Date(deadline) : null,
                domain,
                problemStatement,
                technologies: parsedTechnologies,
                expectedOutcome,
                numberOfStudents: numberOfStudents ? parseInt(numberOfStudents) : undefined,
                proposalFile,
                documentationFile,
                demoFile,
                imageFiles,
                facultyId: facultyProfile.id
            }
        });

        console.log("Created project with ID:", newProject.id);
        res.status(201).json(newProject);
    } catch (err) {
        console.error("CREATE PROJECT ERROR:", err.message, err);
        res.status(500).send('Server error');
    }
};

// @route   GET api/projects/ideas
// @desc    Get all project ideas
// @access  Public
exports.getProjectIdeas = async (req, res) => {
    try {
        const ideas = await prisma.projectIdea.findMany({
            include: {
                faculty: {
                    include: { user: { select: { fullName: true, email: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedIdeas = ideas.map(idea => ({
            ...idea,
            faculty: {
                id: idea.faculty.id,
                fullName: idea.faculty.user?.fullName,
                email: idea.faculty.user?.email,
                department: idea.faculty.department,
                designation: idea.faculty.designation
            }
        }));

        res.json(formattedIdeas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/projects/ideas
// @desc    Create a new project idea
// @access  Private (Faculty/Admin only)
exports.createProjectIdea = async (req, res) => {
    try {
        console.log("createProjectIdea POST received by user:", req.user.id);
        if (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN') {
            console.log("Not auth to create idea", req.user.role);
            return res.status(403).json({ message: 'Not authorized to create project ideas' });
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!facultyProfile) {
            return res.status(400).json({ message: 'Faculty profile not found' });
        }

        const { title, description, suggestedTechnologies, difficultyLevel, skillsRequired, numberOfStudents } = req.body;
        const supportingFile = req.file ? req.file.filename : undefined;

        const parseArray = (val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : undefined; }
        };

        const newIdea = await prisma.projectIdea.create({
            data: {
                title,
                description,
                suggestedTechnologies: parseArray(suggestedTechnologies) || [],
                difficultyLevel,
                skillsRequired: parseArray(skillsRequired) || [],
                numberOfStudents: numberOfStudents ? parseInt(numberOfStudents) : undefined,
                supportingFile,
                facultyId: facultyProfile.id
            }
        });

        console.log("Created project idea with ID:", newIdea.id);
        res.status(201).json(newIdea);
    } catch (err) {
        console.error("CREATE IDEA ERROR:", err.message, err);
        res.status(500).send('Server error');
    }
};

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private (Faculty only, must be owner)
exports.updateProject = async (req, res) => {
    try {
        if (req.user.role !== 'FACULTY') {
            return res.status(403).json({ message: 'Only faculty can edit projects' });
        }

        const facultyProfile = await prisma.facultyProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!facultyProfile) {
            return res.status(400).json({ message: 'Faculty profile not found' });
        }

        const projectId = parseInt(req.params.id);
        const project = await prisma.project.findUnique({ where: { id: projectId } });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.facultyId !== facultyProfile.id) {
            return res.status(403).json({ message: 'Not authorized to edit this project' });
        }

        const { title, domain, numberOfStudents, status } = req.body;

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                title,
                domain,
                numberOfStudents: numberOfStudents ? parseInt(numberOfStudents) : undefined,
                status
            }
        });

        res.json(updatedProject);
    } catch (err) {
        console.error("UPDATE PROJECT ERROR:", err.message);
        res.status(500).send('Server error');
    }
};
