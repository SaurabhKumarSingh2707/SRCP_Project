import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('sarc_token');
    const userRole = localStorage.getItem('sarc_role');
    const isFirstLogin = localStorage.getItem('sarc_isFirstLogin');
    const location = useLocation();

    // If no role is set, redirect to login
    if (!userRole) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Force password change on first login
    if (isFirstLogin === 'true' && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    // If roles are specified and user's role is not included, redirect to their home
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
        if (userRole === 'FACULTY') return <Navigate to="/faculty" replace />;
        return <Navigate to="/student" replace />;
    }

    // Authorized, render the component
    return children;
};

export default ProtectedRoute;
