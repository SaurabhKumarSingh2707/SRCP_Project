const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Ensure role string matches Prisma Enum (uppercase)
        const prismaRole = role ? role.toUpperCase() : 'STUDENT';

        // Create user
        user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: prismaRole,
            },
        });

        // Create profile associated with user
        if (prismaRole === 'STUDENT') {
            await prisma.studentProfile.create({ data: { userId: user.id } });
        } else if (prismaRole === 'FACULTY') {
            await prisma.facultyProfile.create({ data: { userId: user.id } });
        } else if (prismaRole === 'INDUSTRY') {
            await prisma.industryProfile.create({ data: { userId: user.id } });
        } else if (prismaRole === 'ADMIN') {
            await prisma.adminProfile.create({ data: { userId: user.id } });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                role: user.role
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                role: user.role
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/auth/me
// @desc    Get user by token
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                studentProfile: true,
                facultyProfile: true,
                industryProfile: true,
                adminProfile: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, ...userBase } = user;

        res.json({ ...userBase, id: userBase.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT api/auth/profile
// @desc    Update user profile data
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const {
            fullName, department, bio, companyName, designation, skills,
            studentId, yearOfStudy, section, programmingLanguages, projectsCompleted, githubLink, areasOfInterest,
            facultyId, researchAreas, yearsOfExperience, contactNumber, linkedin, pastProjects
        } = req.body;

        // Files from multer
        const profilePhoto = req.files && req.files['profilePhoto'] ? req.files['profilePhoto'][0].filename : undefined;
        const resumeFile = req.files && req.files['resumeFile'] ? req.files['resumeFile'][0].filename : undefined;

        // Helper to safely parse JSON arrays from multipart/form-data
        const parseArray = (val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            try {
                return JSON.parse(val);
            } catch (e) {
                return typeof val === 'string' ? val.split(',').map(s => s.trim()) : undefined;
            }
        };

        const parsedSkills = parseArray(skills);
        const parsedProgrammingLanguages = parseArray(programmingLanguages);
        const parsedAreasOfInterest = parseArray(areasOfInterest);
        const parsedResearchAreas = parseArray(researchAreas);
        const parsedPastProjects = parseArray(pastProjects);

        // Update base user details if provided
        const userUpdateData = {};
        if (fullName !== undefined) userUpdateData.fullName = fullName;
        if (profilePhoto !== undefined) userUpdateData.profilePhoto = profilePhoto;

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: userUpdateData
            });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update respective profile based on role
        if (user.role === 'STUDENT') {
            await prisma.studentProfile.update({
                where: { userId: req.user.id },
                data: {
                    department,
                    bio,
                    skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    studentId,
                    yearOfStudy,
                    section,
                    programmingLanguages: parsedProgrammingLanguages !== undefined ? parsedProgrammingLanguages : undefined,
                    projectsCompleted: projectsCompleted ? parseInt(projectsCompleted) : undefined,
                    githubLink,
                    resumeFile,
                    areasOfInterest: parsedAreasOfInterest !== undefined ? parsedAreasOfInterest : undefined
                }
            });
        } else if (user.role === 'FACULTY') {
            await prisma.facultyProfile.update({
                where: { userId: req.user.id },
                data: {
                    department,
                    bio,
                    designation,
                    facultyId,
                    researchAreas: parsedResearchAreas !== undefined ? parsedResearchAreas : undefined,
                    yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
                    skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    contactNumber,
                    linkedin,
                    pastProjects: parsedPastProjects !== undefined ? parsedPastProjects.map(p => typeof p === 'string' ? p : JSON.stringify(p)) : undefined
                }
            });
        } else if (user.role === 'INDUSTRY') {
            await prisma.industryProfile.update({
                where: { userId: req.user.id },
                data: { companyName, bio, designation }
            });
        } else if (user.role === 'ADMIN') {
            await prisma.adminProfile.update({
                where: { userId: req.user.id },
                data: { department }
            });
        }

        // Refetch and format like getMe
        const updatedUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true, facultyProfile: true, industryProfile: true, adminProfile: true }
        });

        const { password, ...userBase } = updatedUser;
        res.json({ ...userBase, id: userBase.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
