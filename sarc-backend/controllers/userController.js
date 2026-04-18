const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all faculty profiles (Public Directory)
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await prisma.facultyProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhoto: true
                        // Exclude email and password
                    }
                },
                projects: {
                    where: { status: 'OPEN' },
                    select: { id: true, title: true, domain: true, status: true }
                }
            }
        });
        
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
            // Explicitly OMITTING contactNumber, linkedin, email
        }));

        res.json(sanitizedFaculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get single faculty profile
exports.getFacultyById = async (req, res) => {
    try {
        const faculty = await prisma.facultyProfile.findUnique({
            where: { id: parseInt(req.params.id) },
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
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
