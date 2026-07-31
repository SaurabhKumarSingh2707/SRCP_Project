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

        // Seed Review Schedules if they don't exist
        const reviewCount = await prisma.reviewSchedule.count();
        if (reviewCount === 0) {
            await prisma.reviewSchedule.createMany({
                data: [
                    { reviewName: 'REVIEW_1_1', phase: 'PHASE_1', title: 'Phase 1 - Review 1' },
                    { reviewName: 'REVIEW_1_2', phase: 'PHASE_1', title: 'Phase 1 - Review 2' },
                    { reviewName: 'REVIEW_2_1', phase: 'PHASE_2', title: 'Phase 2 - Review 1' },
                    { reviewName: 'REVIEW_2_2', phase: 'PHASE_2', title: 'Phase 2 - Review 2' },
                    { reviewName: 'REVIEW_2_3', phase: 'PHASE_2', title: 'Phase 2 - Review 3' },
                ]
            });
        }
        
        const reviewSchedules = await prisma.reviewSchedule.findMany({
            orderBy: { reviewName: 'asc' }
        });
        
        res.status(200).json({ ...config, phaseOneInstructions: instructions, reviewSchedules });
    } catch (error) {
        console.error("Error fetching system config:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateSystemConfig = async (req, res) => {
    try {
        const { isResearchCollaborationActive, isTeamCreationEnabled, isTeamEditingEnabled, isFacultyTeamEditingEnabled, phaseOneInstructions, isPhaseOneUploadEnabled, activeReviewPhase } = req.body;
        
        const updateData = {};
        if (typeof isResearchCollaborationActive !== 'undefined') updateData.isResearchCollaborationActive = isResearchCollaborationActive;
        if (typeof isTeamCreationEnabled !== 'undefined') updateData.isTeamCreationEnabled = isTeamCreationEnabled;
        if (typeof isTeamEditingEnabled !== 'undefined') updateData.isTeamEditingEnabled = isTeamEditingEnabled;
        if (typeof isFacultyTeamEditingEnabled !== 'undefined') updateData.isFacultyTeamEditingEnabled = isFacultyTeamEditingEnabled;
        if (typeof isPhaseOneUploadEnabled !== 'undefined') updateData.isPhaseOneUploadEnabled = isPhaseOneUploadEnabled;
        if (typeof activeReviewPhase !== 'undefined') updateData.activeReviewPhase = activeReviewPhase;

        // If phase is closed, deactivate all reviews
        if (activeReviewPhase === 'CLOSED') {
            await prisma.reviewSchedule.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

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

exports.updateReviewSchedule = async (req, res) => {
    try {
        const { reviewName } = req.params;
        const { isActive, deadline } = req.body;

        const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
        const review = await prisma.reviewSchedule.findUnique({ where: { reviewName } });

        if (!review) return res.status(404).json({ message: "Review schedule not found" });

        const updateData = {};
        if (typeof deadline !== 'undefined') updateData.deadline = deadline ? new Date(deadline) : null;

        if (typeof isActive !== 'undefined' && isActive !== review.isActive) {
            if (isActive) {
                // Ensure phase matches active system phase
                if (config.activeReviewPhase !== review.phase) {
                    return res.status(400).json({ message: `Cannot activate. System is currently in ${config.activeReviewPhase}, but this review belongs to ${review.phase}.` });
                }
                
                // Deactivate all other reviews
                await prisma.reviewSchedule.updateMany({
                    where: { reviewName: { not: reviewName }, isActive: true },
                    data: { isActive: false }
                });
            }
            updateData.isActive = isActive;
        }

        const updatedReview = await prisma.reviewSchedule.update({
            where: { reviewName },
            data: updateData
        });

        res.status(200).json({ message: "Review schedule updated successfully", review: updatedReview });
    } catch (error) {
        console.error("Error updating review schedule:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
