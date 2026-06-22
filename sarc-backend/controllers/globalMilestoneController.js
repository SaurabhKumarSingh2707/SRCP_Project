const { prisma } = require('../config/prismaClient');

const getPhaseDefaults = (phase) => {
    switch (phase) {
        case 'CLOSED':
            return {
                title: 'Phase 1: Team Formation',
                description: 'Team Formation & Project Abstract Submission'
            };
        case 'FACULTY_SELECTION':
            return {
                title: 'Phase 2: Faculty Selection',
                description: 'Faculty Review & Selection Window'
            };
        case 'STUDENT_SELECTION':
            return {
                title: 'Phase 3: Student Selection',
                description: 'Student Guide Selection Window'
            };
        case 'COMPLETED':
            return {
                title: 'Phase 4: Completed',
                description: 'Guide Selection Process Concluded'
            };
        default:
            return {
                title: 'General Milestone',
                description: 'General project deadline'
            };
    }
};

// Get all global milestones
const getGlobalMilestones = async (req, res) => {
    try {
        const milestones = await prisma.globalMilestone.findMany({
            orderBy: {
                dueDate: 'asc'
            }
        });
        const now = new Date();
        const processed = milestones.map(m => {
            const autoCompleted = m.status === 'COMPLETED' || new Date(m.dueDate) <= now;
            return {
                ...m,
                status: autoCompleted ? 'COMPLETED' : 'PENDING'
            };
        });
        res.json(processed);
    } catch (err) {
        console.error("Error fetching global milestones:", err);
        res.status(500).json({ error: "Failed to fetch global milestones." });
    }
};

// Create a new global milestone (Admin only)
const createGlobalMilestone = async (req, res) => {
    const { title, description, dueDate, relatedPhase } = req.body;
    const now = new Date();
    const isCompleted = new Date(dueDate) <= now;
    
    let finalTitle = title;
    let finalDescription = description;
    if (!finalTitle || !finalDescription) {
        const defaults = getPhaseDefaults(relatedPhase);
        finalTitle = finalTitle || defaults.title;
        finalDescription = finalDescription || defaults.description;
    }

    try {
        const newMilestone = await prisma.globalMilestone.create({
            data: {
                title: finalTitle,
                description: finalDescription,
                dueDate: new Date(dueDate),
                status: isCompleted ? 'COMPLETED' : 'PENDING',
                relatedPhase: relatedPhase || null
            }
        });
        res.status(201).json({
            ...newMilestone,
            status: isCompleted ? 'COMPLETED' : 'PENDING'
        });
    } catch (err) {
        console.error("Error creating global milestone:", err);
        res.status(500).json({ error: "Failed to create global milestone." });
    }
};

// Update a global milestone (Admin only)
const updateGlobalMilestone = async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, relatedPhase } = req.body;
    const now = new Date();
    const isCompleted = dueDate ? (new Date(dueDate) <= now) : false;
    
    let finalTitle = title;
    let finalDescription = description;
    if (relatedPhase && (!finalTitle || !finalDescription)) {
        const defaults = getPhaseDefaults(relatedPhase);
        finalTitle = finalTitle || defaults.title;
        finalDescription = finalDescription || defaults.description;
    }

    try {
        const updatedMilestone = await prisma.globalMilestone.update({
            where: { id: id },
            data: {
                title: finalTitle || undefined,
                description: finalDescription || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                status: dueDate ? (isCompleted ? 'COMPLETED' : 'PENDING') : undefined,
                relatedPhase: relatedPhase !== undefined ? relatedPhase : undefined
            }
        });
        res.json({
            ...updatedMilestone,
            status: (dueDate ? isCompleted : (updatedMilestone.status === 'COMPLETED' || new Date(updatedMilestone.dueDate) <= now)) ? 'COMPLETED' : 'PENDING'
        });
    } catch (err) {
        console.error("Error updating global milestone:", err);
        res.status(500).json({ error: "Failed to update global milestone." });
    }
};

// Delete a global milestone (Admin only)
const deleteGlobalMilestone = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.globalMilestone.delete({
            where: { id: id }
        });
        res.json({ message: "Global milestone deleted successfully." });
    } catch (err) {
        console.error("Error deleting global milestone:", err);
        res.status(500).json({ error: "Failed to delete global milestone." });
    }
};

module.exports = {
    getGlobalMilestones,
    createGlobalMilestone,
    updateGlobalMilestone,
    deleteGlobalMilestone
};
