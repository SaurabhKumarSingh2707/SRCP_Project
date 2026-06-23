const { prisma } = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const { clearCachePattern } = require('../middleware/cacheMiddleware');
const crypto = require('crypto');

// Get all faculty profiles (Public Directory)
exports.getAllFaculty = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Use Promise.all for concurrent reads instead of $transaction to avoid holding DB locks
        const [faculty, total] = await Promise.all([
            prisma.facultyProfile.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            profilePhoto: true
                        }
                    },
                    projects: {
                        where: { status: 'OPEN' },
                        select: { id: true, title: true, domain: true, status: true }
                    }
                },
                skip,
                take: limit
            }),
            prisma.facultyProfile.count()
        ]);

        // Filter out personal details before sending
        const sanitizedFaculty = faculty.map(f => ({
            id: f.id,
            userId: f.userId,
            fullName: f.user.fullName,
            profilePhoto: f.user.profilePhoto,
            department: f.department,
            designation: f.designation,
            researchAreas: f.researchAreas,
            skills: f.skills,
            bio: f.bio,
            projects: f.projects
        }));

        res.json({
            faculty: sanitizedFaculty,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get single faculty profile
exports.getFacultyById = async (req, res) => {
    try {
        const faculty = await prisma.facultyProfile.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhoto: true
                        // Exclude email
                    }
                },
                projects: {
                    select: { id: true, title: true, domain: true, status: true, description: true, skillsRequired: true }
                }
            }
        });

        if (!faculty) return res.status(404).json({ message: "Faculty not found" });

        // Filter out personal details
        const sanitizedFaculty = {
            id: faculty.id,
            userId: faculty.userId,
            fullName: faculty.user.fullName,
            profilePhoto: faculty.user.profilePhoto,
            department: faculty.department,
            designation: faculty.designation,
            researchAreas: faculty.researchAreas,
            skills: faculty.skills,
            bio: faculty.bio,
            projects: faculty.projects
            // Explicitly OMITTING contactNumber, linkedin, email
        };

        res.json(sanitizedFaculty);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const { page = 1, limit = 20, search = '', role = 'STUDENT' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const whereClause = {
            role: role.toUpperCase()
        };

        if (search) {
            whereClause.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    studentProfile: { select: { department: true, yearOfStudy: true, batch: true, section: true } },
                    facultyProfile: { select: { department: true, designation: true } },
                    adminProfile: { select: { department: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.user.count({ where: whereClause })
        ]);

        res.json({
            users,
            total,
            page: parseInt(page),
            limit: take,
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Create user
exports.createUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { fullName, email, password, role, registerNumber, dateOfBirth } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });

        if (registerNumber) {
            const existingReg = await prisma.user.findUnique({ where: { registerNumber } });
            if (existingReg) return res.status(400).json({ message: 'User with this register number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                registerNumber: registerNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                password: hashedPassword,
                role: role || 'STUDENT'
            },
            select: { id: true, fullName: true, email: true, role: true, createdAt: true }
        });

        // Create profile associated with user
        const prismaRole = role || 'STUDENT';
        if (prismaRole === 'STUDENT') {
            await prisma.studentProfile.create({
                data: {
                    userId: newUser.id,
                    department: req.body.department,
                    batch: req.body.batch,
                    section: req.body.section
                }
            });
        } else if (prismaRole === 'FACULTY') {
            await prisma.facultyProfile.create({ data: { userId: newUser.id } });
        } else if (prismaRole === 'INDUSTRY') {
            await prisma.industryProfile.create({ data: { userId: newUser.id } });
        } else if (prismaRole === 'ADMIN') {
            await prisma.adminProfile.create({ data: { userId: newUser.id } });
        }
        if (prismaRole === 'FACULTY') {
            await clearCachePattern('faculty');
        }
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Bulk Create Users
exports.bulkCreateUsers = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { users } = req.body;
        if (!users || !Array.isArray(users)) return res.status(400).json({ message: 'Invalid payload' });

        // 1. Check existing emails and register numbers in a single query
        const emails = users.map(u => String(u.email).trim()).filter(Boolean);
        const regNumbers = users.map(u => u.studentId ? String(u.studentId).trim() : null).filter(Boolean);

        const existingUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { in: emails } },
                    { registerNumber: { in: regNumbers } }
                ]
            },
            select: { email: true, registerNumber: true }
        });
        
        const existingEmailSet = new Set(existingUsers.map(u => u.email).filter(Boolean));
        const existingRegSet = new Set(existingUsers.map(u => u.registerNumber).filter(Boolean));

        let errors = [];
        const validUsers = [];
        
        const payloadEmailSet = new Set();
        const payloadRegSet = new Set();

        for (const u of users) {
            const email = String(u.email).trim();
            const studentId = u.studentId ? String(u.studentId).trim() : null;

            if (existingEmailSet.has(email) || payloadEmailSet.has(email)) {
                errors.push({ email: email, message: 'Email already exists in DB or is duplicated in Excel' });
                continue;
            }
            if (studentId && (existingRegSet.has(studentId) || payloadRegSet.has(studentId))) {
                errors.push({ email: email, message: `Register number ${studentId} already exists in DB or Excel` });
                continue;
            }

            payloadEmailSet.add(email);
            if (studentId) payloadRegSet.add(studentId);
            
            validUsers.push(u);
        }

        if (validUsers.length === 0) {
            return res.status(201).json({ message: `Created 0 users`, createdCount: 0, errors });
        }

        const usersToInsert = [];
        const studentProfiles = [];
        const facultyProfiles = [];
        const industryProfiles = [];
        const adminProfiles = [];

        // 2. Hash passwords concurrently (Use a lower salt round for 1500+ bulk uploads to avoid 10-second Serverless timeout)
        await Promise.all(validUsers.map(async (u) => {
            const defaultPass = crypto.randomBytes(12).toString('base64url');
            const rawPassword = u.password !== undefined && u.password !== null && u.password !== '' ? String(u.password) : defaultPass;
            const hashedPassword = await bcrypt.hash(rawPassword, 4); // Extremely fast for bulk 1500+ inserts
            const prismaRole = u.role ? String(u.role).toUpperCase() : 'STUDENT';
            const userId = crypto.randomUUID();
            
            // Handle Excel date string parsing (YYYY-MM-DD, DD-MM-YYYY, or serial number)
            let parsedDateOfBirth = null;
            if (u.dateOfBirth) {
                const dobStr = String(u.dateOfBirth).trim();
                if (/^\d+$/.test(dobStr)) {
                    // Excel serial date (days since Dec 30, 1899)
                    const serial = parseInt(dobStr, 10);
                    parsedDateOfBirth = new Date((serial - 25569) * 86400 * 1000);
                } else {
                    // Try parsing DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD manually FIRST
                    const parts = dobStr.split(/[-/]/);
                    let validManualDate = false;
                    if (parts.length === 3) {
                        let year = parseInt(parts[2], 10);
                        let month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
                        let day = parseInt(parts[0], 10);
                        
                        // If year is first (YYYY-MM-DD)
                        if (parts[0].length === 4) {
                            year = parseInt(parts[0], 10);
                            month = parseInt(parts[1], 10) - 1;
                            day = parseInt(parts[2], 10);
                        }
                        const parsed = new Date(Date.UTC(year, month, day));
                        if (!isNaN(parsed.getTime())) {
                            parsedDateOfBirth = parsed;
                            validManualDate = true;
                        }
                    }
                    
                    // Fallback to Date.parse only if manual parsing failed
                    if (!validManualDate) {
                        const dateNum = Date.parse(dobStr);
                        if (!isNaN(dateNum)) {
                            parsedDateOfBirth = new Date(dateNum);
                        }
                    }
                }
            }

            usersToInsert.push({
                id: userId,
                fullName: String(u.fullName),
                email: String(u.email),
                registerNumber: u.studentId ? String(u.studentId) : null,
                password: hashedPassword,
                role: prismaRole,
                dateOfBirth: parsedDateOfBirth
            });

            if (prismaRole === 'STUDENT') {
                studentProfiles.push({
                    userId: userId,
                    department: u.department ? String(u.department) : null,
                    yearOfStudy: u.yearOfStudy ? String(u.yearOfStudy) : null,
                    batch: u.batch ? String(u.batch) : null,
                    section: u.section ? String(u.section) : null
                });
            } else if (prismaRole === 'FACULTY') {
                facultyProfiles.push({ userId: userId, department: u.department, designation: u.designation });
            } else if (prismaRole === 'INDUSTRY') {
                industryProfiles.push({ userId: userId });
            } else if (prismaRole === 'ADMIN') {
                adminProfiles.push({ userId: userId, department: u.department });
            }
        }));

        // 3. Insert all records at once in Supabase using createMany
        await prisma.$transaction([
            prisma.user.createMany({ data: usersToInsert, skipDuplicates: true }),
            ...(studentProfiles.length > 0 ? [prisma.studentProfile.createMany({ data: studentProfiles, skipDuplicates: true })] : []),
            ...(facultyProfiles.length > 0 ? [prisma.facultyProfile.createMany({ data: facultyProfiles, skipDuplicates: true })] : []),
            ...(industryProfiles.length > 0 ? [prisma.industryProfile.createMany({ data: industryProfiles, skipDuplicates: true })] : []),
            ...(adminProfiles.length > 0 ? [prisma.adminProfile.createMany({ data: adminProfiles, skipDuplicates: true })] : [])
        ]);

        await clearCachePattern('faculty');
        res.status(201).json({ message: `Created ${usersToInsert.length} users`, createdCount: usersToInsert.length, errors });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const { fullName, email, role, password, registerNumber, dateOfBirth } = req.body;

        const updateData = { 
            fullName, 
            email, 
            role,
            registerNumber: registerNumber || null
        };
        
        if (dateOfBirth) {
            updateData.dateOfBirth = new Date(dateOfBirth);
        } else if (dateOfBirth === '') {
            updateData.dateOfBirth = null;
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: updateData,
            select: { id: true, fullName: true, email: true, role: true, createdAt: true }
        });

        if (updateData.role === 'STUDENT') {
            await prisma.studentProfile.upsert({
                where: { userId: updatedUser.id },
                update: {
                    department: req.body.department,
                    batch: req.body.batch,
                    section: req.body.section
                },
                create: {
                    userId: updatedUser.id,
                    department: req.body.department,
                    batch: req.body.batch,
                    section: req.body.section
                }
            });
        }
        if (updatedUser.role === 'FACULTY') {
            await clearCachePattern('faculty');
        }
        res.json(updatedUser);
    } catch (error) {
        console.error("Error:", error.message || error);
        if (error.code === 'P2002') return res.status(400).json({ message: 'Email already exists' });
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;

        // Let Prisma's cascade delete handle related records
        await prisma.user.delete({
            where: { id: id }
        });
        await clearCachePattern('faculty');
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Bulk delete users
exports.bulkDeleteUsers = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        await prisma.user.deleteMany({
            where: {
                id: { in: ids.map(id => id) }
            }
        });
        
        await clearCachePattern('faculty');
        res.json({ message: `Successfully deleted ${ids.length} users` });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error" });
    }
};


// Admin: Analytics
exports.getAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const cacheKey = 'admin:analytics';
        const redisClient = require('../config/redisClient');
        if (redisClient) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) return res.json(JSON.parse(cachedData));
            } catch (err) {
                console.error('Redis error:', err);
            }
        }

        const [
            totalUsers,
            activeProjects,
            totalTeams,
            finalizedTeams,
            systemAlerts,
            deptGroup,
            totalStudents,
            activeStudents
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count({
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
            }),
            prisma.team.count(),
            prisma.team.count({ where: { status: 'APPROVED' } }),
            prisma.notification.count({ where: { read: false, type: 'ALERT' } }),
            prisma.studentProfile.groupBy({
                by: ['department'],
                _count: { department: true },
                where: { department: { not: null } }
            }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.teamMember.count({
                where: { inviteStatus: 'ACCEPTED' }
            })
        ]);

        // Compute success rate (e.g. % of finalized teams)
        const successRate = totalTeams > 0 ? Math.round((finalizedTeams / totalTeams) * 100) : 0;

        // Department data based on Student Profiles
        const departmentData = deptGroup.map(d => ({
            name: d.department || 'Unknown',
            projects: d._count.department
        })).sort((a, b) => b.projects - a.projects).slice(0, 5);

        // Participation Data
        const participationData = [
            { name: 'Active Students', value: activeStudents, color: '#800000' },
            { name: 'Inactive/Browsing', value: Math.max(0, totalStudents - activeStudents), color: '#FFD700' },
        ];

        // Recent Flags (mocked for now as we don't have a moderation table)
        const recentFlags = [];

        const result = {
            stats: {
                totalUsers,
                activeProjects,
                successRate: `${successRate}%`,
                systemAlerts
            },
            departmentData,
            participationData,
            recentFlags
        };

        if (redisClient) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300); // Cache for 5 minutes
            } catch (err) {
                console.error('Redis error:', err);
            }
        }

        res.json(result);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: "Server Error fetching analytics" });
    }
};

