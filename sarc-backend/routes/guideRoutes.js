const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const guideTeamController = require('../controllers/guideTeamController');
const facultyGuideController = require('../controllers/facultyGuideController');
const guideAdminController = require('../controllers/guideAdminController');
const cacheResponse = require('../middleware/cacheMiddleware');

// Helper to check roles
const isStudent = authMiddleware.checkRole('STUDENT');
const isFaculty = authMiddleware.checkRole('FACULTY');
const isAdmin = authMiddleware.checkRole('ADMIN');

// -----------------------------------------------------
// Phase 1 — Team Formation (Student)
// -----------------------------------------------------
router.get('/phase', authMiddleware, guideTeamController.getPhase);
router.post('/teams', authMiddleware, isStudent, guideTeamController.createTeam);
router.post('/teams/invite', authMiddleware, isStudent, guideTeamController.inviteMember);
router.post('/teams/invite/cancel', authMiddleware, isStudent, guideTeamController.cancelInvite);
router.put('/teams/invite/respond', authMiddleware, isStudent, guideTeamController.respondToInvite);
router.get('/teams/invites/my', authMiddleware, isStudent, guideTeamController.getMyPendingInvites);
router.get('/teams/my', authMiddleware, isStudent, guideTeamController.getMyTeam);
router.put('/teams/my', authMiddleware, isStudent, guideTeamController.updateTeam);
router.delete('/teams/my', authMiddleware, isStudent, guideTeamController.deleteMyTeam);
router.get('/teams/invites/faculty', authMiddleware, isStudent, guideTeamController.getMyGuideInvites); // Helper for Phase 2

// -----------------------------------------------------
// Phase 2 — Faculty Selection Window (Faculty)
// -----------------------------------------------------
router.get('/faculty/teams', authMiddleware, isFaculty, facultyGuideController.getFinalizedTeams);
router.post('/faculty/select', authMiddleware, isFaculty, facultyGuideController.selectTeams);
router.get('/faculty/my-selections', authMiddleware, isFaculty, facultyGuideController.getMySelections);
router.get('/faculty/allocated', authMiddleware, isFaculty, facultyGuideController.getAllocatedTeams);
router.put('/faculty/teams/:teamId/edit-details', authMiddleware, isFaculty, facultyGuideController.editTeamDetails);
router.put('/faculty/teams/:teamId/review-approval', authMiddleware, isFaculty, guideTeamController.toggleTeamReviewApproval);
router.put('/faculty/teams/:teamId/review-checklist', authMiddleware, isFaculty, guideTeamController.updateTeamReviewChecklist);


// -----------------------------------------------------
// -----------------------------------------------------
// Phase 3 — Student Selection Window (Student)
// -----------------------------------------------------
router.get('/faculty/available', authMiddleware, isStudent, cacheResponse(60), guideTeamController.getAvailableFaculty);
router.post('/teams/:id/select-guide', authMiddleware, isStudent, guideTeamController.selectGuide);

// -----------------------------------------------------
// Phase 4 — Dashboard and Admin (Admin/All)
// -----------------------------------------------------
router.get('/dashboard', authMiddleware, cacheResponse(60), guideAdminController.getDashboard);

// Admin controls
router.get('/config', authMiddleware, isAdmin, cacheResponse(30), guideAdminController.getConfigAndStats);
router.put('/config/phase', authMiddleware, isAdmin, guideAdminController.changePhase);
router.post('/config/reset', authMiddleware, isAdmin, guideAdminController.resetPhase);
router.get('/teams/export', authMiddleware, isAdmin, guideAdminController.exportTeams);
router.get('/reviews/export/:reviewName', authMiddleware, isAdmin, guideAdminController.exportReviewData);
router.put('/reviews/:reviewName/checklist', authMiddleware, isAdmin, guideAdminController.updateReviewChecklist);
router.put('/faculty-slots/:facultyId', authMiddleware, isAdmin, guideAdminController.updateFacultySlot);
router.get('/admin/teams', authMiddleware, isAdmin, cacheResponse(60), guideAdminController.getAllTeams);
router.put('/admin/teams/finalize-all', authMiddleware, isAdmin, guideAdminController.finalizeAllTeams);
router.put('/admin/teams/:teamId/finalize', authMiddleware, isAdmin, guideAdminController.toggleTeamFinalization);
router.put('/admin/teams/:teamId/edit-details', authMiddleware, isAdmin, guideAdminController.editTeamDetails);
router.delete('/admin/teams/:teamId', authMiddleware, isAdmin, guideAdminController.deleteTeam);
router.post('/admin/teams/:teamId/assign', authMiddleware, isAdmin, guideAdminController.assignStudentToTeam);
router.delete('/admin/teams/:teamId/members/:userId', authMiddleware, isAdmin, guideAdminController.removeMemberFromTeam);

module.exports = router;
