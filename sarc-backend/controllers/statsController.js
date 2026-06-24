const { prisma } = require('../config/prismaClient');
exports.getPortalStats = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=1200');
        const [activeProjects, facultyCount, studentCount, industryCount] = await Promise.all([
            prisma.project.count({ where: { status: 'OPEN' } }),
            prisma.user.count({ where: { role: 'FACULTY' } }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'INDUSTRY' } })
        ]);

        res.json({
            activeProjects,
            facultyResearchers: facultyCount,
            studentCollaborators: studentCount,
            industryMentors: industryCount
        });
    } catch (err) {
        console.error("GET STATS ERROR:", err.message);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
};
