const { prisma } = require('../config/prismaClient');

// Create a new instruction for a team
const createInstruction = async (req, res) => {
    try {
        const guideId = req.user.id;
        const { teamId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Verify the guide is assigned to this team
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (team.guideId !== guideId) {
            return res.status(403).json({ message: 'You are not authorized to send instructions to this team' });
        }

        const instruction = await prisma.teamInstruction.create({
            data: {
                teamId,
                guideId,
                content
            }
        });

        res.status(201).json({ message: 'Instruction created successfully', instruction });
    } catch (error) {
        console.error('Create instruction error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get instructions for a team
const getTeamInstructions = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { teamId } = req.params;

        // Verify user is either the guide or a member of the team
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: true
            }
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const isGuide = team.guideId === userId;
        const isMember = team.members.some(member => member.userId === userId);
        const isAdmin = userRole === 'ADMIN';

        if (!isGuide && !isMember && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view these instructions' });
        }

        // Build query conditions
        const query = {
            where: { teamId },
            include: {
                readBy: {
                    select: { fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        };

        // All users (Guides, Students, Admins) can see the full history of instructions

        const instructions = await prisma.teamInstruction.findMany(query);

        res.status(200).json(instructions);
    } catch (error) {
        console.error('Get instructions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark instruction as read (Team Leader only)
const markInstructionAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { instructionId } = req.params;

        const instruction = await prisma.teamInstruction.findUnique({
            where: { id: instructionId },
            include: { team: true }
        });

        if (!instruction) {
            return res.status(404).json({ message: 'Instruction not found' });
        }

        // Check if the current user is the leader of the team
        if (instruction.team.leaderId !== userId) {
            return res.status(403).json({ message: 'Only the team leader can mark instructions as read' });
        }

        const updatedInstruction = await prisma.teamInstruction.update({
            where: { id: instructionId },
            data: {
                isRead: true,
                readById: userId,
                readAt: new Date()
            }
        });

        res.status(200).json({ message: 'Instruction marked as read', instruction: updatedInstruction });
    } catch (error) {
        console.error('Mark instruction read error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createInstruction,
    getTeamInstructions,
    markInstructionAsRead
};
