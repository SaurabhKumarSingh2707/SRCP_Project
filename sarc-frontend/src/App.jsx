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
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Shared authenticated routes */}
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/student/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/faculty/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
                <Route path="/admin/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
            </Routes>
        </div>
    );
}

export default App;
