import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GlobalLoader from './components/common/GlobalLoader';
import ErrorBoundary from './components/common/ErrorBoundary';

import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';

// Lazy load all page components for code-splitting
const ChangePassword = lazy(() => import('./pages/public/ChangePassword'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ProjectDetail = lazy(() => import('./pages/shared/ProjectDetail'));
const Profile = lazy(() => import('./pages/shared/Profile'));
const BrowseProjects = lazy(() => import('./pages/student/BrowseProjects'));
const StudentApplications = lazy(() => import('./pages/student/StudentApplications'));
const FacultyApplications = lazy(() => import('./pages/faculty/FacultyApplications'));
const TeamFormation = lazy(() => import('./pages/shared/TeamFormation'));
const Milestones = lazy(() => import('./pages/shared/Milestones'));
const FacultyDirectory = lazy(() => import('./pages/shared/FacultyDirectory'));
const FacultyProfileView = lazy(() => import('./pages/shared/FacultyProfileView'));

// Guide Selection Pages
const GuideTeamCreate = lazy(() => import('./pages/student/GuideTeamCreate'));
const GuideTeamMy = lazy(() => import('./pages/student/GuideTeamMy'));

const TeamInvites = lazy(() => import('./pages/student/TeamInvites'));
const GuideSelect = lazy(() => import('./pages/student/GuideSelect'));
const FacultyTeamSelect = lazy(() => import('./pages/faculty/FacultyTeamSelect'));
const FacultyMyPicks = lazy(() => import('./pages/faculty/FacultyMyPicks'));
const FacultyAllocatedTeams = lazy(() => import('./pages/faculty/FacultyAllocatedTeams'));
const FacultyTeamDetails = lazy(() => import('./pages/faculty/FacultyTeamDetails'));
const GuideAdminConfig = lazy(() => import('./pages/admin/GuideAdminConfig'));
const AdminUserManagement = lazy(() => import('./pages/admin/AdminUserManagement'));
const AdminTeamFinalization = lazy(() => import('./pages/admin/AdminTeamFinalization'));
const AdminMilestonesConfig = lazy(() => import('./pages/admin/AdminMilestonesConfig'));
const GuideDashboard = lazy(() => import('./pages/shared/GuideDashboard'));

function App() {
    return (
        <div className="min-h-screen relative bg-canvas">
            <ErrorBoundary>
                <Suspense fallback={<GlobalLoader />}>
                    <Routes>
                        {/* Public / Unauthenticated Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    
                    {/* Independent Authenticated Routes (No Layout) */}
                    <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />

                    {/* Dashboard Layout Routes */}
                    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        
                        {/* Student Routes */}
                        <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                        <Route path="/student/projects" element={<ProtectedRoute allowedRoles={['STUDENT']}><BrowseProjects /></ProtectedRoute>} />
                        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><Profile /></ProtectedRoute>} />
                        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentApplications /></ProtectedRoute>} />
                        <Route path="/student/teams" element={<ProtectedRoute allowedRoles={['STUDENT']}><TeamFormation /></ProtectedRoute>} />
                        <Route path="/student/milestones" element={<ProtectedRoute allowedRoles={['STUDENT']}><Milestones /></ProtectedRoute>} />
                        <Route path="/student/directory" element={<ProtectedRoute allowedRoles={['STUDENT']}><FacultyDirectory /></ProtectedRoute>} />
                        <Route path="/student/directory/:id" element={<ProtectedRoute allowedRoles={['STUDENT']}><FacultyProfileView /></ProtectedRoute>} />
                        <Route path="/guide/team/create" element={<ProtectedRoute allowedRoles={['STUDENT']}><GuideTeamCreate /></ProtectedRoute>} />
                        <Route path="/guide/team/my" element={<ProtectedRoute allowedRoles={['STUDENT']}><GuideTeamMy /></ProtectedRoute>} />

                        <Route path="/guide/invites/team" element={<ProtectedRoute allowedRoles={['STUDENT']}><TeamInvites /></ProtectedRoute>} />
                        <Route path="/guide/select" element={<ProtectedRoute allowedRoles={['STUDENT']}><GuideSelect /></ProtectedRoute>} />

                        {/* Faculty Routes */}
                        <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
                        <Route path="/faculty/projects" element={<ProtectedRoute allowedRoles={['FACULTY']}><BrowseProjects /></ProtectedRoute>} />
                        <Route path="/faculty/profile" element={<ProtectedRoute allowedRoles={['FACULTY']}><Profile /></ProtectedRoute>} />
                        <Route path="/faculty/applications" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyApplications /></ProtectedRoute>} />
                        <Route path="/faculty/teams" element={<ProtectedRoute allowedRoles={['FACULTY']}><TeamFormation /></ProtectedRoute>} />
                        <Route path="/faculty/milestones" element={<ProtectedRoute allowedRoles={['FACULTY']}><Milestones /></ProtectedRoute>} />
                        <Route path="/guide/faculty/select" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyTeamSelect /></ProtectedRoute>} />
                        <Route path="/guide/faculty/my-picks" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyMyPicks /></ProtectedRoute>} />
                        <Route path="/guide/faculty/allocated" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyAllocatedTeams /></ProtectedRoute>} />
                        <Route path="/faculty/team/:id" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyTeamDetails /></ProtectedRoute>} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['ADMIN']}><BrowseProjects /></ProtectedRoute>} />
                        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><Profile /></ProtectedRoute>} />
                        <Route path="/admin/guide/config" element={<ProtectedRoute allowedRoles={['ADMIN']}><GuideAdminConfig /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUserManagement /></ProtectedRoute>} />
                        <Route path="/admin/teams/finalize" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminTeamFinalization /></ProtectedRoute>} />
                        <Route path="/admin/milestones/config" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminMilestonesConfig /></ProtectedRoute>} />

                        {/* Shared Authenticated Routes inside Dashboard */}
                        <Route path="/guide/dashboard" element={<ProtectedRoute><GuideDashboard /></ProtectedRoute>} />
                    </Route>
                </Routes>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

export default App;
