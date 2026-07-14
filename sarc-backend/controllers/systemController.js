const { prisma } = require('../config/prismaClient');

exports.getSystemConfig = async (req, res) => {
    try {
        let config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
        if (!config) {
            config = await prisma.systemConfig.create({ data: { id: 'singleton', isResearchCollaborationActive: true, isTeamCreationEnabled: true, isTeamEditingEnabled: true, isFacultyTeamEditingEnabled: true } });
        }
        res.status(200).json(config);
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
        if (typeof phaseOneInstructions !== 'undefined') updateData.phaseOneInstructions = phaseOneInstructions;
        if (typeof isPhaseOneUploadEnabled !== 'undefined') updateData.isPhaseOneUploadEnabled = isPhaseOneUploadEnabled;

        const config = await prisma.systemConfig.upsert({
            where: { id: 'singleton' },
            update: updateData,
            create: { id: 'singleton', ...updateData }
        });

        res.status(200).json({ message: 'System configuration updated successfully', config });
    } catch (error) {
        console.error("Error updating system config:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
