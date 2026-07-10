import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Compass, Send, Users, Flag, User, Bell, Search, Menu, X, LogOut, Settings, Building, Check, ArrowRight, UserPlus, ClipboardCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SupportTicketModal from '../common/SupportTicketModal';

export const Sidebar = ({ isOpen, setIsOpen, userData }) => {
    const location = useLocation();

    const { data: systemConfig } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`);
            if (!res.ok) throw new Error('Failed to fetch config');
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // cache for 5 minutes
    });

    const role = userData?.role?.toLowerCase() || localStorage.getItem('sarc_role')?.toLowerCase() || 'student';
    const basePath = role;

    const { data: pendingInvites } = useQuery({
        queryKey: ['pendingInvites', 'my'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invites/my`, {
                headers,
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: role === 'student',
        refetchInterval: 30000,
    });
    
    const pendingCount = pendingInvites?.length || 0;

    let menuSections = [];

    if (role === 'faculty') {
        menuSections = [
            {
                title: 'Main Menu',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            },
            {
                title: 'Guide Selection',
                links: [
                    { name: 'Select Project Teams', icon: UserPlus, path: '/guide/faculty/select' },
                    { name: 'Allocated Teams', icon: ClipboardCheck, path: '/guide/faculty/allocated' },
                ]
            }
        ];
    } else if (role === 'admin') {
        menuSections = [
            {
                title: 'Admin Controls',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                    { name: 'User Management', icon: Users, path: '/admin/users' },
                    { name: 'Team Finalization', icon: Check, path: '/admin/teams/finalize' },
                    { name: 'Global Milestones', icon: Flag, path: '/admin/milestones/config' },
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            },
            {
                title: 'Guide Selection Control',
                links: [
                    { name: 'Guide Dashboard', icon: LayoutDashboard, path: '/guide/dashboard' },
                    { name: 'Guide Selection Control', icon: Settings, path: '/admin/guide/config' },
                ]
            }
        ];
    } else {
        // Student role
        menuSections = [
            {
                title: 'Main Menu',
                links: [
                    { name: 'Dashboard', icon: LayoutDashboard, path: `/${basePath}` },
                ]
            },
            {
                title: 'Guide Selection',
                links: [
                    { name: 'Project Team', icon: Users, path: '/guide/team/my' },
                    { name: 'Team Invites', icon: Bell, path: '/guide/invites/team', badge: pendingCount > 0 ? pendingCount : null },
                    { name: 'Select Guide', icon: User, path: '/guide/select' },
                ]
            },
            {
                title: 'Account',
                links: [
                    { name: 'Profile', icon: User, path: `/${basePath}/profile` },
                ]
            }
        ];
    }

    return (
        <>
            <aside className="fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 hidden lg:block">
                <div className="flex items-center justify-between h-16 px-6 border-b border-primary/10">
                    <Link to="/" className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                        <img
                            src="/images/logo.webp"
                            alt="Sathyabama Logo"
                            width="200"
                            height="40"
                            className="h-10 w-auto object-contain mix-blend-multiply drop-shadow-sm"
                        />
                        SATHYABAMA
                    </Link>
                    <button className="lg:hidden text-slate-400 hover:text-slate-600 w-12 h-12 flex items-center justify-center" onClick={() => setIsOpen(false)} aria-label="Close Sidebar">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(100vh-4rem)] space-y-8">
                    {menuSections.map((section, idx) => (
                        <div key={section.title}>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 px-3 flex items-center gap-3">
                                {section.title}
                                <span className="h-px bg-slate-100 flex-1"></span>
                            </p>
                            <nav className="space-y-1.5">
                                {section.links.map((link) => {
                                    const isActive = location.pathname === link.path || (link.path === `/${basePath}` && location.pathname === `/${basePath}`);
                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            title={link.name}
                                            className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                                                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/30 transform scale-[1.02]'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-primary hover:translate-x-1'
                                                }`}
                                        >
                                            <link.icon size={20} className={`transition-colors ${isActive ? 'text-secondary-light' : 'text-slate-400 group-hover:text-primary'}`} />
                                            <span className="flex-1">{link.name}</span>
                                            {link.badge && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
};

const MobileBottomNav = ({ isVisible, role, basePath }) => {
    const location = useLocation();
    let links = [];
    
    if (role === 'faculty') {
        links = [
            { name: 'Home', icon: LayoutDashboard, path: `/${basePath}` },
            { name: 'Select', icon: UserPlus, path: '/guide/faculty/select' },
            { name: 'Allocated', icon: ClipboardCheck, path: '/guide/faculty/allocated' },
            { name: 'Profile', icon: User, path: `/${basePath}/profile` }
        ];
    } else if (role === 'admin') {
        links = [
            { name: 'Home', icon: LayoutDashboard, path: `/${basePath}` },
            { name: 'Users', icon: Users, path: '/admin/users' },
            { name: 'Teams', icon: Check, path: '/admin/teams/finalize' },
            { name: 'Guides', icon: Settings, path: '/admin/guide/config' },
            { name: 'Profile', icon: User, path: `/${basePath}/profile` }
        ];
    } else {
        links = [
            { name: 'Home', icon: LayoutDashboard, path: `/${basePath}` },
            { name: 'Team', icon: Users, path: '/guide/team/my' },
            { name: 'Select', icon: Search, path: '/guide/select' },
            { name: 'Profile', icon: User, path: `/${basePath}/profile` }
        ];
    }

    const displayLinks = links.slice(0, 5);

    return (
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 bg-primary z-50 transition-transform duration-300 flex justify-around items-center h-[72px] pb-2 pt-1 shadow-[0_-8px_20px_-5px_rgba(128,0,0,0.3)] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            {displayLinks.map(link => {
                const isActive = location.pathname === link.path || (link.path === `/${basePath}` && location.pathname === `/${basePath}`);
                return (
                    <Link key={link.name} to={link.path} className="flex flex-col items-center justify-center w-full h-full relative group">
                        {isActive && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-secondary rounded-b-md shadow-[0_2px_12px_rgba(255,215,0,0.6)]"></div>
                        )}
                        <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary' : 'text-white/60 group-hover:text-white'}`}>
                            <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : 'mt-1'}`}>
                                <link.icon size={24} className={isActive ? 'stroke-[2.5px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'stroke-2'} />
                            </div>
                            <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${isActive ? 'text-secondary opacity-100' : 'opacity-80 mt-1'}`}>
                                {link.name}
                            </span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
};

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    // Mobile scroll hiding logic
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            // Only apply hide/show logic on mobile (< 1024px for lg breakpoint)
            if (window.innerWidth >= 1024) {
                if (!isVisible) setIsVisible(true);
                return;
            }

            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false); // Scrolling down - hide
            } else {
                setIsVisible(true);  // Scrolling up - show
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY, isVisible]);

    const handleNotificationClick = (notif) => {
        if (!notif.read) {
            markAsRead(notif.id);
        }
        if (notif.type === 'SUPPORT_TICKET') {
            setSelectedTicket(notif);
            setIsTicketModalOpen(true);
            setIsNotificationOpen(false);
        }
    };

    const queryClient = useQueryClient();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: userData } = useQuery({
        queryKey: ['authMe'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                credentials: 'include'
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('sarc_role');
                window.location.href = '/login';
                return null;
            }
            if (!res.ok) throw new Error('Failed to fetch user');
            const data = await res.json();
            return data;
        },
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });

    const userInitials = React.useMemo(() => {
        if (!userData?.fullName) return 'U';
        const nameParts = userData.fullName.trim().split(' ');
        if (nameParts.length > 1) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0]) {
            return nameParts[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    }, [userData]);

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        },
        staleTime: 60 * 1000 // Cache for 1 minute
    });

    const markAsRead = async (id) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                credentials: 'include'
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (err) {
            console.error("Error marking notification as read", err);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error('Logout error', e);
        }
        localStorage.removeItem('sarc_role');
        window.location.href = '/login';
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-canvas flex font-body">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userData={userData} />

            <main className="flex-1 lg:ml-64 min-w-0">
                <header className="min-h-[4rem] h-auto sm:h-16 py-2 sm:py-0 bg-white border-b border-slate-200 flex items-center justify-between px-2 sm:px-6 lg:px-8 z-30 sticky top-0 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                        <div className="lg:hidden flex items-center shrink-0">
                            <Link to="/" className="flex items-center">
                                <img src="/images/logo.webp" alt="Logo" className="h-8 sm:h-10 w-auto object-contain mix-blend-multiply mr-1 sm:mr-3" />
                            </Link>
                        </div>
                        <h1 className="text-sm sm:text-base md:text-xl font-bold font-heading text-primary tracking-tight uppercase leading-tight line-clamp-2 sm:line-clamp-none">
                            Guide Selection Portal
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="relative" ref={notificationRef}>
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                                aria-label="Notifications"
                            >
                                <Bell size={18} className="sm:w-5 sm:h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transform transition-all z-50">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{unreadCount} new</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group ${!notif.read ? 'bg-primary/5' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {notif.type === 'SUPPORT_TICKET' && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleNotificationClick(notif);
                                                                        }}
                                                                        className="text-[10px] text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm ml-auto"
                                                                    >
                                                                        View & Reply
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!notif.read && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                                                className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors shrink-0"
                                                                title="Mark as read"
                                                                aria-label="Mark as read"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={profileRef}>
                            <div
                                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-secondary font-bold text-lg border border-secondary/50 shadow-sm cursor-pointer hover:bg-primary-dark transition-colors overflow-hidden shrink-0"
                                title="User Profile"
                                aria-label="User Profile"
                                role="button"
                                tabIndex={0}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsProfileOpen(!isProfileOpen); }}
                            >
                                {userData?.profilePhoto ? (
                                    <img 
                                        src={userData.profilePhoto.startsWith('http') ? userData.profilePhoto : `${import.meta.env.VITE_API_URL}/uploads/${userData.profilePhoto.split(/[\\/]/).pop()}`} 
                                        alt="Profile" 
                                        width="48"
                                        height="48"
                                        className="w-full h-full object-cover object-top"
                                    />
                                ) : (
                                    userInitials
                                )}
                            </div>

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

                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
                    <Outlet />
                </div>
            </main>
            <MobileBottomNav 
                isVisible={isVisible} 
                role={userData?.role?.toLowerCase() || localStorage.getItem('sarc_role')?.toLowerCase() || 'student'} 
                basePath={userData?.role?.toLowerCase() || localStorage.getItem('sarc_role')?.toLowerCase() || 'student'} 
            />
            <SupportTicketModal 
                isOpen={isTicketModalOpen} 
                onClose={() => setIsTicketModalOpen(false)} 
                notification={selectedTicket} 
            />
        </div>
    );
};
