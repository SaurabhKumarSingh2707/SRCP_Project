const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { prisma } = require('../config/prismaClient');
const redisClient = require('../config/redisClient');
// Ensure JWT Secrets are available (fail fast)
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET or JWT_REFRESH_SECRET is not defined in environment variables.');
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Password Strength Validator
const isPasswordStrong = (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(password);
};

// Helper: Send Email
const sendEmail = async (to, subject, text) => {
    try {
        let transporter;
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } else {
            console.warn("WARNING: SMTP_USER not set. Trying Ethereal test account. This often fails on Netlify/Serverless!");
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }

        const mailOptions = {
            from: '"SARCG Admin" <admin@sarcg.com>',
            to,
            subject,
            text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        if (!process.env.SMTP_USER) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("CRITICAL ERROR: Failed to send email:", error.message);
        console.error("Please configure SMTP_USER and SMTP_PASS in your environment variables to fix email delivery.");
        // We do not throw the error here to prevent 500 Internal Server Errors in the API
    }
};

// Helper: Generate Tokens
const generateTokens = async (userId, role, sessionId) => {
    const activeSessionId = sessionId || crypto.randomUUID();
    const payload = { user: { id: userId, role, sessionId: activeSessionId } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    // Hash refresh token for DB storage
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 1. Update refresh token on User
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: hashedRefreshToken }
    });

    // 2. Upsert session in PostgreSQL
    await prisma.session.upsert({
        where: { userId },
        update: { id: activeSessionId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        create: { id: activeSessionId, userId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });

    // 3. Store active session in Redis (expires in 30 days)
    if (redisClient) {
        try {
            await redisClient.set(`session:user:${userId}`, activeSessionId, 'EX', 30 * 24 * 60 * 60);
        } catch (err) {
            console.error('Redis error caching session on token generation:', err);
        }
    }

    return { accessToken, refreshToken };
};


// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!isPasswordStrong(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Prevent Privilege Escalation - only allow STUDENT or FACULTY
        const requestedRole = role ? role.toUpperCase() : 'STUDENT';
        const prismaRole = requestedRole === 'ADMIN' ? 'STUDENT' : requestedRole;

        user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: prismaRole,
            },
        });

        // Create the correct profile based on role
        if (prismaRole === 'STUDENT') {
            await prisma.studentProfile.create({ data: { userId: user.id } });
        } else if (prismaRole === 'FACULTY') {
            await prisma.facultyProfile.create({ data: { userId: user.id } });
        } else if (prismaRole === 'INDUSTRY') {
            await prisma.industryProfile.create({ data: { userId: user.id } });
        }

        // Send Verification Email
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${email}`;
        await sendEmail(user.email, 'Verify your email address', `Welcome to SARCG! Please verify your email by clicking: ${verifyUrl}`);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
    try {
        console.log('Login attempt received:', req.body);
        const { loginType, email, password, registerNumber, dateOfBirth } = req.body;

        let user;

        if (loginType === 'STUDENT') {
            const isFirstTime = req.body.isFirstTime;
            
            if (!registerNumber) {
                return res.status(400).json({ message: 'Register Number is required for Student login.' });
            }
            user = await prisma.user.findUnique({ where: { registerNumber } });
            
            if (!user || user.role !== 'STUDENT') {
                return res.status(401).json({ message: 'Invalid Student credentials.' });
            }

            if (isFirstTime) {
                if (!dateOfBirth) {
                    return res.status(400).json({ message: 'Date of Birth is required for first time login.' });
                }
                if (user.accountStatus !== 'PENDING') {
                    return res.status(400).json({ message: 'Account is already active. Please uncheck "First time login" and use your password.' });
                }
                // Verify DOB (assuming YYYY-MM-DD format from frontend)
                const providedDob = new Date(dateOfBirth).toISOString().split('T')[0];
                const storedDob = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : null;

                if (!storedDob || providedDob !== storedDob) {
                    return res.status(401).json({ message: 'Invalid Date of Birth.' });
                }
            } else {
                if (!password) {
                    return res.status(400).json({ message: 'Password is required.' });
                }
                let isMatch = false;
                if (user.accountStatus === 'PENDING') {
                    // User forgot to check the 'First time login' box and typed DOB into the password field.
                    // Let's generously check if the password matches their DOB.
                    const storedDob = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : null;
                    if (storedDob) {
                        const [year, month, day] = storedDob.split('-');
                        const validFormats = [
                            storedDob, // YYYY-MM-DD
                            `${day}-${month}-${year}`, // DD-MM-YYYY
                            `${day}/${month}/${year}`, // DD/MM/YYYY
                            `${day}${month}${year}` // DDMMYYYY
                        ];
                        if (validFormats.includes(password)) {
                            // Automatically treat this as a valid first-time login!
                            // We generate tokens and let them through to the reset password page.
                            isMatch = true;
                        } else {
                            return res.status(400).json({ message: 'First time login detected. Please check "First time login" and use your Date of Birth.' });
                        }
                    } else {
                        return res.status(400).json({ message: 'First time login detected. Please check "First time login" and use your Date of Birth.' });
                    }
                } else {
                    isMatch = await bcrypt.compare(password, user.password);
                }

                if (!isMatch) {
                    return res.status(401).json({ message: 'Invalid Student credentials.' });
                }
            }
        } else {
            // Staff Login
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and Password are required for Staff login.' });
            }
            user = await prisma.user.findUnique({ where: { email } });

            if (!user || user.role === 'STUDENT') {
                return res.status(401).json({ message: 'Invalid Staff credentials.' });
            }

            let isMatch = false;

            if (user.role === 'FACULTY' && user.accountStatus === 'PENDING') {
                // For pending faculty accounts, use Employee ID as the password
                const profile = await prisma.facultyProfile.findUnique({ where: { userId: user.id } });
                if (profile && profile.employeeId === password) {
                    isMatch = true;
                } else {
                    return res.status(400).json({ message: 'First time login detected. Please use your Employee ID as the password.' });
                }
            } else {
                if (!user.password) {
                    return res.status(401).json({ message: 'Account setup incomplete.' });
                }
                isMatch = await bcrypt.compare(password, user.password);
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid Staff credentials.' });
            }
        }

        // Check Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return res.status(403).json({ message: 'Account is temporarily locked.' });
        }

        // Reset login attempts
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null }
        });

        const { accessToken, refreshToken } = await generateTokens(user.id, user.role);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        };
        
        res.cookie('sarc_token', accessToken, cookieOptions);
        res.cookie('sarc_refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

        res.json({ token: accessToken, refreshToken, user: { id: user.id, fullName: user.fullName, email: user.email, registerNumber: user.registerNumber, role: user.role, isFirstLogin: user.accountStatus === 'PENDING' } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.sarc_refreshToken || req.body.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { clockTolerance: 30 });
        const userId = decoded.user.id;
        const tokenSessionId = decoded.user.sessionId;

        if (!tokenSessionId) {
            return res.status(401).json({ message: 'Invalid refresh token: missing session ID' });
        }

        // Validate session ID
        let activeSessionId = null;
        if (redisClient) {
            try {
                activeSessionId = await redisClient.get(`session:user:${userId}`);
            } catch (err) {
                console.error('Redis error in refresh token:', err);
            }
        }

        if (!activeSessionId) {
            const dbSession = await prisma.session.findUnique({
                where: { userId }
            });
            activeSessionId = dbSession?.id;

            // Backfill Redis if found in DB
            if (activeSessionId && redisClient) {
                try {
                    await redisClient.set(`session:user:${userId}`, activeSessionId, 'EX', 30 * 24 * 60 * 60);
                } catch (err) {
                    console.error('Redis backfill error in refresh token:', err);
                }
            }
        }

        if (!activeSessionId || activeSessionId !== tokenSessionId) {
            return res.status(401).json({ message: 'Session invalidated. Another device logged in.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        if (hashedProvidedToken !== user.refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const payload = { user: { id: user.id, role: user.role, sessionId: tokenSessionId } };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('sarc_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ token: newAccessToken });
    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
            return res.status(401).json({ message: 'Refresh token expired or invalid' });
        }
        console.error('Refresh token error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
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
                facultyGuideSlot: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, refreshToken, resetPasswordToken, failedLoginAttempts, lockoutUntil, ...userBase } = user;

        res.json({ ...userBase, id: userBase.id, isFirstLogin: user.accountStatus === 'PENDING' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   PUT api/auth/profile
// @desc    Update user profile data
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const {
            fullName, department, bio, companyName, designation, skills,
            yearOfStudy, section, programmingLanguages, projectsCompleted, githubLink, areasOfInterest,
            employeeId, researchAreas, yearsOfExperience, contactNumber, linkedin, pastProjects
        } = req.body;

        const profilePhoto = req.body.profilePhoto;
        const resumeFile = req.body.resumeFile;

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
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'STUDENT') {
            await prisma.studentProfile.update({
                where: { userId: req.user.id },
                data: {
                    department, bio, skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    yearOfStudy, section,
                    programmingLanguages: parsedProgrammingLanguages !== undefined ? parsedProgrammingLanguages : undefined,
                    projectsCompleted: projectsCompleted ? parseInt(projectsCompleted) : undefined,
                    githubLink, resumeFile,
                    areasOfInterest: parsedAreasOfInterest !== undefined ? parsedAreasOfInterest : undefined
                }
            });
        } else if (user.role === 'FACULTY') {
            await prisma.facultyProfile.update({
                where: { userId: req.user.id },
                data: {
                    department, bio, designation, employeeId,
                    researchAreas: parsedResearchAreas !== undefined ? parsedResearchAreas : undefined,
                    yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
                    skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    contactNumber, linkedin,
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

        if (user.role === 'FACULTY') {
            if (redisClient) {
                try {
                    const keys = await redisClient.keys('*faculty*');
                    if (keys.length > 0) {
                        await redisClient.del(keys);
                    }
                } catch (cacheErr) {
                    console.error('Failed to clear faculty cache on profile update', cacheErr);
                }
            }
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true, facultyProfile: true, industryProfile: true, adminProfile: true }
        });

        const { password, refreshToken, resetPasswordToken, failedLoginAttempts, lockoutUntil, ...userBase } = updatedUser;
        res.json({ ...userBase, id: userBase.id, isFirstLogin: updatedUser.accountStatus === 'PENDING' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



// @route   POST api/auth/force-change-password
// @desc    Force password change on first login
// @access  Private
exports.forceChangePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        if (!isPasswordStrong(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                accountStatus: 'ACTIVE',
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });

        res.status(200).json({ message: 'Password changed successfully. Your account is now active.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/logout
// @desc    Logout user & invalidate session
// @access  Private
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Delete session from Session table
        try {
            await prisma.session.delete({
                where: { userId }
            });
        } catch (dbErr) {
            // Ignore record-not-found error (P2025) since session is already gone
            if (dbErr.code !== 'P2025') {
                throw dbErr;
            }
        }

        // 2. Clear refreshToken in User table
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });

        // 3. Clear session in Redis
        if (redisClient) {
            try {
                await redisClient.del(`session:user:${userId}`);
            } catch (err) {
                console.error('Redis error on logout:', err);
            }
        }

        res.clearCookie('sarc_token');
        res.clearCookie('sarc_refreshToken');

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
