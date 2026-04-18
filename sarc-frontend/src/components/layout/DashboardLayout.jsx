import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, Send, Users, Flag, User, Bell, Search, Menu, X, LogOut, Settings, Building } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();

    // In a real app, these paths would be dynamic based on the user's role (student, faculty, admin)
    // For now, we mock some standard paths that mostly point back to the dashboard or placeholders.
    const basePath = location.pathname.split('/')[1] || 'student';

    let links = [
        { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
        { name: 'Browse Projects', icon: Compass, path: `/${basePath}/projects` },
        { name: 'My Applications', icon: Send, path: `/${basePath}/applications` },
        { name: 'Team Formation', icon: Users, path: `/${basePath}/teams` },
        { name: 'Milestones', icon: Flag, path: `/${basePath}/milestones` },
        { name: 'Faculty Directory', icon: Building, path: `/${basePath}/directory` },
        { name: 'Profile', icon: User, path: `/${basePath}/profile` },
    ];

    if (basePath === 'faculty') {
        links = links.filter(link => link.name !== 'Faculty Directory');
        links = links.map(link => link.name === 'My Applications' ? { ...link, name: 'Student Applications' } : link);
    }

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-primary/10">
                    <Link to="/" className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                        <img
                            src="/images/SRCP_logo.png"
                            alt="SRCP Logo"
                            className="h-10 w-auto object-contain mix-blend-multiply drop-shadow-sm"
                        />
                        SATHYABAMA
                    </Link>
                    <button className="lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Portal Menu</p>
                    <nav className="space-y-1">
                        {links.map((link) => {
                            const isActive = location.pathname === link.path || (link.path === `/${basePath}` && location.pathname === `/${basePath}`);
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive
                                        ? 'bg-primary/5 text-primary border-r-4 border-r-primary'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <link.icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userInitials, setUserInitials] = useState('U'); // Default to 'U' if not found
    const navigate = useLocation(); // we'll use window.location for simpler logout routing without changing imports too much

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                if (!token) return;

                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Ensure the response is OK before parsing JSON to avoid errors if the backend is down
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.fullName) {
                        setUserData(data);
                        const nameParts = data.fullName.trim().split(' ');
                        let initials = '';
                        if (nameParts.length > 1) {
                            initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                        } else if (nameParts.length === 1 && nameParts[0]) {
                            initials = nameParts[0].substring(0, 2);
                        }
                        setUserInitials(initials.toUpperCase());
                    }
                }
            } catch (err) {
                console.error("Error fetching user data", err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('sarc_token');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-canvas flex font-body">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 lg:ml-64 min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-slate-400 hover:text-slate-600"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden sm:flex relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search Sathyabama projects..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
                        </button>

                        {/* Profile Dropdown Container */}
                        <div className="relative profile-menu-container">
                            <div
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary font-bold text-sm border border-secondary/50 shadow-sm cursor-pointer hover:bg-primary-dark transition-colors"
                                title="User Profile"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                {userInitials}
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transform transition-all z-50">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                            {userData?.fullName || 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {userData?.email || 'Loading email...'}
                                        </p>
                                    </div>
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                            Role
                                        </div>
                                        <div className="px-3 py-2 text-sm text-slate-700 bg-slate-50 rounded-md mx-2 capitalize">
                                            {userData?.role?.toLowerCase() || 'Student'}
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            to={userData?.role === 'FACULTY' ? '/faculty/profile' : userData?.role === 'ADMIN' ? '/admin/profile' : '/student/profile'}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <Settings size={16} />
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
