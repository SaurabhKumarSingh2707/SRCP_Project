import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import AuthPage from './pages/public/AuthPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProjectDetail from './pages/shared/ProjectDetail';
import Profile from './pages/shared/Profile';
import BrowseProjects from './pages/student/BrowseProjects';
import StudentApplications from './pages/student/StudentApplications';
import FacultyApplications from './pages/faculty/FacultyApplications';
import TeamFormation from './pages/shared/TeamFormation';
import Milestones from './pages/shared/Milestones';
import FacultyDirectory from './pages/shared/FacultyDirectory';
import FacultyProfileView from './pages/shared/FacultyProfileView';
import { DashboardLayout } from './components/layout/DashboardLayout';

function App() {
    return (
        <div className="min-h-screen relative bg-canvas">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/projects" element={<BrowseProjects />} />
                <Route path="/faculty" element={<FacultyDashboard />} />
                <Route path="/faculty/projects" element={<BrowseProjects />} />
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Shared authenticated routes */}
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/student/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/faculty/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/admin/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                
                {/* New Feature Routes (Student) */}
                <Route path="/student/applications" element={<StudentApplications />} />
                <Route path="/student/teams" element={<TeamFormation />} />
                <Route path="/student/milestones" element={<Milestones />} />
                <Route path="/student/directory" element={<FacultyDirectory />} />
                <Route path="/student/directory/:id" element={<FacultyProfileView />} />

                {/* New Feature Routes (Faculty) */}
                <Route path="/faculty/applications" element={<FacultyApplications />} />
                <Route path="/faculty/teams" element={<TeamFormation />} />
                <Route path="/faculty/milestones" element={<Milestones />} />
            </Routes>
        </div>
    );
}

export default App;
