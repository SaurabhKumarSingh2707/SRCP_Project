const { prisma } = require('../config/prismaClient');
const nodemailer = require('nodemailer');

exports.contactAdmin = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Find all admin users
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true, email: true }
        });

        if (admins.length > 0) {
            // Create a notification for each admin
            const notificationsData = admins.map(admin => ({
                userId: admin.id,
                title: 'New Support Ticket',
                type: 'SUPPORT_TICKET',
                message: `From: ${name} (${email})\nSubject: ${subject}\n\n${message}`,
                link: '' // Could link to a support tickets page if it existed
            }));

            await prisma.notification.createMany({
                data: notificationsData
            });

            // Optional: send an email to admins if SMTP is configured
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                const adminEmails = admins.map(admin => admin.email).join(',');
                
                const mailOptions = {
                    from: '"SARCG Admin" <admin@sarcg.com>',
                    to: adminEmails,
                    subject: `[Support Request] ${subject}`,
                    text: `New Support Request:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
                };

                // Non-blocking email sending
                transporter.sendMail(mailOptions).catch(console.error);
            }
        }

        res.status(200).json({ message: 'Your message has been sent successfully.' });
    } catch (error) {
        console.error("Support Contact Error:", error.message || error);
        res.status(500).json({ message: 'Server error processing your request. Please try again later.' });
    }
};

exports.replyTicket = async (req, res) => {
    try {
        const { email, subject, replyMessage } = req.body;
        
        if (!email || !replyMessage) {
            return res.status(400).json({ message: 'Email and reply message are required' });
        }

        // Try to find if this user exists in our system to send an in-app notification
        const targetUser = await prisma.user.findFirst({
            where: { email }
        });

        if (targetUser) {
            await prisma.notification.create({
                data: {
                    userId: targetUser.id,
                    title: 'Admin Support Reply',
                    type: 'SUPPORT_REPLY',
                    message: `Reply to: ${subject}\n\n${replyMessage}`
                }
            });
        }

        // Send email if configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: '"SARCG Admin" <admin@sarcg.com>',
                to: email,
                subject: subject,
                text: replyMessage,
            };

            // Non-blocking email
            transporter.sendMail(mailOptions).catch(console.error);
        }

        res.json({ message: 'Reply sent successfully' });
    } catch (error) {
        console.error("Support Reply Error:", error.message || error);
        res.status(500).json({ message: 'Failed to send reply' });
    }
};
