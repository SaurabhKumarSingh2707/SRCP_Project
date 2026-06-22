const { prisma } = require('../config/prismaClient');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        console.error("Error:", err.message || err);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const id = req.params.id;

        // Mark all as read if id brings bulk command, or just single
        if (req.params.id === 'all') {
            await prisma.notification.deleteMany({
                where: { userId: req.user.id }
            });
            return res.json({ message: 'All notifications deleted' });
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const deleted = await prisma.notification.delete({
            where: { id }
        });

        res.json(deleted);
    } catch (err) {
        console.error("Error:", err.message || err);
        res.status(500).json({ message: 'Server error marking read/deleting' });
    }
};
