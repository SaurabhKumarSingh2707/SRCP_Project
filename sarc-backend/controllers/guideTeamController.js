const { prisma } = require('../config/prismaClient');

exports.getPhase = async (req, res) => {
    try {
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        res.json({ phase: config?.phase || 'CLOSED' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createTeam = async (req, res) => {
    try {
        const { projectTitle, description, domain } = req.body;
        const studentId = req.user.id; // from auth middleware

        if (!projectTitle || !description || !domain) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        let { teamName } = req.body;
        if (!teamName) {
            teamName = projectTitle; // fallback if frontend stops sending teamName
        }

        // Check if config phase is CLOSED
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        const sysConfig = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
        if (sysConfig && sysConfig.isTeamCreationEnabled === false) {
             return res.status(403).json({ message: 'Team creation has been disabled by the administration.' });
        }

        // 1. Check student is not already in any Team (as leader or ACCEPTED member)
        const existingLeadership = await prisma.team.findFirst({ where: { leaderId: studentId } });
        if (existingLeadership) {
            return res.status(400).json({ message: 'You are already a leader of a team.' });
        }

        const existingMembership = await prisma.teamMember.findFirst({
            where: {
                userId: studentId,
                inviteStatus: 'ACCEPTED'
            }
        });
        if (existingMembership) {
            return res.status(400).json({ message: 'You are already an accepted member of a team.' });
        }

        const currentYear = new Date().getFullYear();
        const dept = 'GEN'; // we can fetch from student if needed, but lets just use GEN for guideTeamController or fetch it
        // Wait, let's fetch studentProfile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: studentId },
            include: { user: true }
        });
        const finalDept = (studentProfile?.department || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
        const crypto = require('crypto');
        const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
        const generatedTeamCode = `${currentYear}-${finalDept}-${randomHex}`;

        // 3 & 4. Create Team and TeamMember
        const newTeam = await prisma.team.create({
            data: {
                id: generatedTeamCode,
                name: teamName,
                description,
                domain,
                abstractFile: req.body.abstractFile || null,
                leaderId: studentId,
                members: {
                    create: {
                        userId: studentId,
                        isLeader: true,
                        inviteStatus: 'ACCEPTED'
                    }
                }
            },
            include: {
                members: true
            }
        });

        // Delete pending invites and notify their leaders
        try {
            const pendingInvites = await prisma.teamMember.findMany({
                where: {
                    userId: studentId,
                    inviteStatus: 'PENDING'
                },
                include: {
                    team: true
                }
            });

            if (pendingInvites.length > 0) {
                // Delete teamMember records
                await prisma.teamMember.deleteMany({
                    where: {
                        userId: studentId,
                        inviteStatus: 'PENDING'
                    }
                });

                // Delete team invite notifications sent to this student
                await prisma.notification.deleteMany({
                    where: {
                        userId: studentId,
                        type: 'TEAM_INVITE'
                    }
                });

                // Notify leaders
                const studentUser = studentProfile?.user || await prisma.user.findUnique({ where: { id: studentId } });
                for (const invite of pendingInvites) {
                    await prisma.notification.create({
                        data: {
                            userId: invite.team.leaderId,
                            title: "Team Invitation Declined",
                            message: `${studentUser.fullName} created their own team and declined your invitation.`,
                            type: "TEAM_INVITE_RESPONSE"
                        }
                    });
                }
            }
        } catch (cleanupError) {
            console.error("Error during invite cleanup:", cleanupError);
        }

        res.status(201).json(newTeam);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error creating team' });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { projectTitle, description, domain } = req.body;
        const leaderId = req.user.id;
        
        let { teamName } = req.body;

        const team = await prisma.team.findFirst({
            where: { leaderId }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        
        // Allow editing project details even if finalized

        const updatedTeam = await prisma.team.update({
            where: { id: team.id },
            data: {
                name: teamName || projectTitle || team.name,
                description: description || team.description,
                domain: domain || team.domain
            }
        });

        res.json({ message: 'Team updated successfully', team: updatedTeam });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error updating team' });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { teamId, registerNumberOrEmail } = req.body;
        const leaderId = req.user.id;

        // Verify phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        // 1. Verify requester is the leader
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can invite members' });

        // 2. Count current members with inviteStatus PENDING or ACCEPTED
        const activeMembersCount = team.members.filter(m => m.inviteStatus === 'PENDING' || m.inviteStatus === 'ACCEPTED').length;
        if (activeMembersCount >= 3) {
            return res.status(400).json({ message: 'Team already has the maximum number of members (3)' });
        }

        // 3. Find target student
        const targetStudent = await prisma.user.findFirst({
            where: {
                role: 'STUDENT',
                OR: [
                    { email: registerNumberOrEmail },
                    { registerNumber: registerNumberOrEmail }
                ]
            },
            include: { studentProfile: true }
        });

        if (!targetStudent) return res.status(404).json({ message: 'Student not found' });
        if (targetStudent.id === leaderId) return res.status(400).json({ message: 'Cannot invite yourself' });

        // 4. Check target student has no PENDING or ACCEPTED invite
        const existingInvite = await prisma.teamMember.findFirst({
            where: {
                userId: targetStudent.id,
                inviteStatus: { in: ['PENDING', 'ACCEPTED'] }
            }
        });

        if (existingInvite) return res.status(400).json({ message: 'Student is already in a team or has a pending invite' });

        // 5. Create or Update TeamMember
        const invite = await prisma.teamMember.upsert({
            where: {
                teamId_userId: {
                    teamId: team.id,
                    userId: targetStudent.id
                }
            },
            update: {
                inviteStatus: 'PENDING'
            },
            create: {
                teamId: team.id,
                userId: targetStudent.id,
                inviteStatus: 'PENDING'
            }
        });

        // 6. Create Notification
        const leader = await prisma.user.findUnique({ where: { id: leaderId } });
        await prisma.notification.create({
            data: {
                userId: targetStudent.id,
                title: "Team Invitation",
                message: `${leader.fullName} has invited you to join their team "${team.name}". Accept or Reject.`,
                type: "TEAM_INVITE",
                link: JSON.stringify({ teamId: team.id, leaderId })
            }
        });

        res.status(200).json({ message: 'Invitation sent successfully', invite });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error sending invitation' });
    }
};

exports.cancelInvite = async (req, res) => {
    try {
        const { teamId, inviteeId } = req.body;
        const leaderId = req.user.id;
        console.log(`[BACKEND] cancelInvite called: teamId=${teamId}, inviteeId=${inviteeId}, leaderId=${leaderId}`);

        // Verify phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        // 1. Verify requester is the leader
        const team = await prisma.team.findUnique({
            where: { id: teamId }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can cancel invitations' });

        // 2. Find the pending invitation
        const invite = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: team.id,
                    userId: inviteeId
                }
            }
        });

        if (!invite) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invite.inviteStatus !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending invitations can be cancelled' });
        }

        // 3. Delete the invitation (TeamMember record)
        await prisma.teamMember.delete({
            where: { id: invite.id }
        });

        // 4. Delete the notification sent to the student invitee
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    userId: inviteeId,
                    type: 'TEAM_INVITE',
                }
            });

            for (const notif of notifications) {
                if (notif.link) {
                    try {
                        const linkObj = JSON.parse(notif.link);
                        if (linkObj.teamId === team.id) {
                            await prisma.notification.delete({
                                where: { id: notif.id }
                            });
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                }
            }
        } catch (notifErr) {
            console.error("Error deleting notification:", notifErr);
        }

        // 5. Notify the student that the invitation was cancelled
        try {
            await prisma.notification.create({
                data: {
                    userId: inviteeId,
                    title: "Invitation Cancelled",
                    message: `The invitation to join team "${team.name}" has been cancelled by the team leader.`,
                    type: "TEAM_INVITE_CANCELLED"
                }
            });
        } catch (notifyErr) {
            console.error("Error creating cancellation notification:", notifyErr);
        }

        res.status(200).json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error cancelling invitation' });
    }
};

exports.respondToInvite = async (req, res) => {
    try {
        const { teamId, action } = req.body;
        const studentId = req.user.id;

        if (!['ACCEPT', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Verify phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const invite = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: team.id,
                    userId: studentId
                }
            }
        });

        if (!invite || invite.inviteStatus !== 'PENDING') {
            return res.status(400).json({ message: 'No pending invitation found for this team' });
        }

        const student = await prisma.user.findUnique({ where: { id: studentId } });

        if (action === 'ACCEPT') {
            await prisma.teamMember.update({
                where: { id: invite.id },
                data: { inviteStatus: 'ACCEPTED' }
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Team Invitation Accepted",
                    message: `${student.fullName} accepted and joined ${team.name}`,
                    type: "TEAM_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Invitation accepted' });
        } else if (action === 'REJECT') {
            await prisma.teamMember.delete({
                where: { id: invite.id }
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Team Invitation Declined",
                    message: `${student.fullName} declined your invitation. You can invite someone else.`,
                    type: "TEAM_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Invitation rejected' });
        }
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error responding to invite' });
    }
};

exports.getMyPendingInvites = async (req, res) => {
    try {
        const studentId = req.user.id;

        const invites = await prisma.teamMember.findMany({
            where: {
                userId: studentId,
                inviteStatus: 'PENDING'
            },
            include: {
                team: {
                    include: {
                        leader: true
                    }
                }
            }
        });

        res.json(invites);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching invites' });
    }
};

exports.getMyTeam = async (req, res) => {
    try {
        const studentId = req.user.id;

        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: studentId,
                inviteStatus: 'ACCEPTED'
            },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    include: { studentProfile: true }
                                }
                            }
                        },
                        guide: true
                    }
                }
            }
        });

        if (!membership) return res.json(null);

        const teamData = { ...membership.team, currentUserId: studentId };
        console.log("getMyTeam returning:", { leaderId: teamData.leaderId, currentUserId: teamData.currentUserId });
        res.json(teamData);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching team' });
    }
};

exports.selectGuide = async (req, res) => {
    try {
        const { id: teamId } = req.params;
        const { facultyId } = req.body;
        const leaderId = req.user.id;

        // 1. Check phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'STUDENT_SELECTION') {
            return res.status(400).json({ message: 'Student selection phase is not active.' });
        }

        // 2. Verify team and leader
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can select a guide' });

        if (team.guideId) {
             return res.status(400).json({ message: 'Team already has a guide assigned or selected.' });
        }
        if (team.status !== 'FORMING' && team.status !== 'REQUESTED_GUIDE') {
             return res.status(400).json({ message: 'Team status is not valid for guide selection.' });
        }

        // 3. Select guide via transaction
        await prisma.$transaction(async (tx) => {
            const slot = await tx.facultyGuideSlot.findUnique({ where: { facultyId: facultyId } });
            
            if (!slot || slot.usedSlots >= slot.totalSlots) {
                throw new Error("This guide has no available slots.");
            }

            // Atomic constrained update: only increment if usedSlots < totalSlots
            const updateCount = await tx.facultyGuideSlot.updateMany({
                where: { 
                    facultyId: facultyId,
                    usedSlots: { lt: slot.totalSlots } 
                },
                data: { usedSlots: { increment: 1 } }
            });

            if (updateCount.count === 0) {
                throw new Error("This guide has just reached maximum capacity. Please select another guide.");
            }

            await tx.team.update({
                where: { id: teamId },
                data: {
                    guideId: facultyId,
                    status: 'APPROVED',
                    selectionSource: 'STUDENT'
                }
            });
        }, {
            timeout: 10000
        });

        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

        await prisma.notification.create({
            data: {
                userId: leaderId,
                title: "Guide Selected",
                message: `You have successfully selected Prof. ${faculty.fullName} as your guide.`,
                type: "GUIDE_SELECTED"
            }
        });

        res.json({ message: 'Guide selected successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(400).json({ message: error.message || 'Server error selecting guide' });
    }
};

exports.getAvailableFaculty = async (req, res) => {
    try {
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'STUDENT_SELECTION') {
            return res.status(200).json([]);
        }

        const slots = await prisma.facultyGuideSlot.findMany({
            include: {
                faculty: {
                    include: { facultyProfile: true }
                }
            }
        });

        const available = slots.map(slot => ({
            facultyId: slot.facultyId,
            name: slot.faculty.fullName,
            profilePhoto: slot.faculty.profilePhoto,
            department: slot.faculty.facultyProfile?.department,
            researchAreas: slot.faculty.facultyProfile?.researchAreas || [],
            totalSlots: slot.totalSlots,
            usedSlots: slot.usedSlots,
            remainingSlots: slot.totalSlots - slot.usedSlots,
            available: slot.usedSlots < slot.totalSlots
        }));

        res.json(available);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching available faculty' });
    }
};



exports.getMyGuideInvites = async (req, res) => {
    // Deprecated: Faculty selections are now instantly approved.
    res.json([]);
};

exports.deleteMyTeam = async (req, res) => {
    try {
        const leaderId = req.user.id;
        console.log(`[BACKEND] deleteMyTeam called: leaderId=${leaderId}`);
        
        const team = await prisma.team.findFirst({
            where: { leaderId }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        
        if (team.status !== 'FORMING') {
            return res.status(400).json({ message: 'Cannot delete a finalized team' });
        }

        await prisma.$transaction(async (tx) => {
            if (team.guideId) {
                await tx.facultyGuideSlot.update({
                    where: { facultyId: team.guideId },
                    data: { usedSlots: { decrement: 1 } }
                });
            }

            await tx.teamMember.deleteMany({
                where: { teamId: team.id }
            });

            await tx.team.delete({
                where: { id: team.id }
            });
        });

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error deleting team' });
    }
};
