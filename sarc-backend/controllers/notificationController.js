const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Mark all as read if id brings bulk command, or just single
        if (req.params.id === 'all') {
            await prisma.notification.updateMany({
                where: { userId: req.user.id, read: false },
                data: { read: true }
            });
            return res.json({ message: 'All marked as read' });
        }

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking read' });
    }
};
