const { prisma } = require('../config/prismaClient');

exports.getSystemConfig = async (req, res) => {
    try {
        let config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
        if (!config) {
            config = await prisma.systemConfig.create({ data: { id: 'singleton', isResearchCollaborationActive: true, isTeamCreationEnabled: true, isTeamEditingEnabled: true, isFacultyTeamEditingEnabled: true } });
        }
        
        // Fetch phase one instructions
        let instructions = await prisma.phaseInstruction.findMany({
            where: { phase: 'PHASE_I', isActive: true },
            orderBy: { order: 'asc' }
        });
        
        // Fallback for legacy string array before first save
        if (instructions.length === 0 && config.phaseOneInstructions && config.phaseOneInstructions.length > 0) {
            instructions = config.phaseOneInstructions;
        }
        
        res.status(200).json({ ...config, phaseOneInstructions: instructions });
    } catch (error) {
        console.error("Error fetching system config:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateSystemConfig = async (req, res) => {
    try {
        const { isResearchCollaborationActive, isTeamCreationEnabled, isTeamEditingEnabled, isFacultyTeamEditingEnabled, phaseOneInstructions, isPhaseOneUploadEnabled } = req.body;
        
        const updateData = {};
        if (typeof isResearchCollaborationActive !== 'undefined') updateData.isResearchCollaborationActive = isResearchCollaborationActive;
        if (typeof isTeamCreationEnabled !== 'undefined') updateData.isTeamCreationEnabled = isTeamCreationEnabled;
        if (typeof isTeamEditingEnabled !== 'undefined') updateData.isTeamEditingEnabled = isTeamEditingEnabled;
        if (typeof isFacultyTeamEditingEnabled !== 'undefined') updateData.isFacultyTeamEditingEnabled = isFacultyTeamEditingEnabled;
        if (typeof isPhaseOneUploadEnabled !== 'undefined') updateData.isPhaseOneUploadEnabled = isPhaseOneUploadEnabled;

        const config = await prisma.systemConfig.upsert({
            where: { id: 'singleton' },
            update: updateData,
            create: { id: 'singleton', ...updateData }
        });
        
        // Handle Phase Instructions update
        if (phaseOneInstructions && Array.isArray(phaseOneInstructions)) {
            // Transaction to clear old and insert new instructions to maintain order and sync
            await prisma.$transaction([
                prisma.phaseInstruction.deleteMany({ where: { phase: 'PHASE_I' } }),
                prisma.phaseInstruction.createMany({
                    data: phaseOneInstructions.map((inst, index) => ({
                        title: inst.title || 'Instruction',
                        description: inst.description || inst, // Fallback if string is sent during transition
                        type: inst.type || 'INFO',
                        phase: 'PHASE_I',
                        order: index,
                        targetDate: inst.targetDate ? new Date(inst.targetDate) : null,
                        isActive: true
                    }))
                })
            ]);
        }

        const updatedInstructions = await prisma.phaseInstruction.findMany({
            where: { phase: 'PHASE_I', isActive: true },
            orderBy: { order: 'asc' }
        });

        res.status(200).json({ message: 'System configuration updated successfully', config: { ...config, phaseOneInstructions: updatedInstructions } });
    } catch (error) {
        console.error("Error updating system config:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
