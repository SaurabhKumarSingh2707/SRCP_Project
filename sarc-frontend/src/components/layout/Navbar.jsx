import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';
import { Bell, Check, Settings, User } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('sarc_role');
        if (role) {
            setIsLoggedIn(true);
            fetchNotifications();
        } else {
            setIsLoggedIn(false);
        }
    }, [location]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAsRead = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
                method: 'PUT'
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                method: 'POST'
            });
        } catch (e) {
            console.error("Logout failed", e);
        }
        localStorage.removeItem('sarc_role');
        setIsLoggedIn(false);
        navigate('/');
    };


    const unreadCount = notifications.filter(n => !n.read).length;

    const role = localStorage.getItem('sarc_role');
    let dashboardPath = '/student'; // fallback
    if (role === 'FACULTY') dashboardPath = '/faculty';
    else if (role === 'ADMIN') dashboardPath = '/admin';

    return (
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-primary/20 shadow-sm">
            {/* Top Academic Ribbon */}
            <div className="bg-primary text-secondary text-xs py-1 text-center font-medium tracking-widest uppercase">
                Established 1987
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to={isLoggedIn ? dashboardPath : "/"} className="text-xl md:text-2xl font-bold font-heading text-primary flex items-center gap-3">
                            <img src="/images/logo.webp" alt="Sathyabama Logo" className="h-12 w-auto object-contain" width="48" height="48" />
                            <span className="hidden sm:inline">SATHYABAMA</span> <span className="text-slate-500 font-normal text-sm hidden lg:inline border-l border-slate-300 ml-3 pl-3">SARCG Portal</span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-8 ml-10 border-l border-slate-200 pl-8">
                            <a href="#about" className="text-slate-700 hover:text-primary font-medium transition-colors">About</a>
                            {isLoggedIn && (
                                <Link to={dashboardPath} className="text-primary font-bold transition-colors">Dashboard</Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isLoggedIn ? (
                            <>
                                {/* Notification Dropdown */}
                                <div className="relative">
                                    <button
                                        aria-label="Notifications"
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 text-slate-500 hover:text-primary transition-colors focus:outline-none rounded-full hover:bg-slate-50"
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 transform opacity-100 scale-100 transition-all origin-top-right">
                                            <div className="p-4 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                                                <h3 className="font-bold text-slate-800 font-heading">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={() => markAsRead('all')} className="text-xs text-primary font-medium hover:underline">
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div key={n.id} className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                                                            <div className="flex-grow">
                                                                <p className={`text-sm ${!n.read ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                                                                    {n.message}
                                                                </p>
                                                                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                            {!n.read && (
                                                                <button onClick={() => markAsRead(n.id)} className="text-primary hover:bg-primary/10 p-1.5 rounded-full h-fit flex-shrink-0" title="Mark as read">
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" className="hidden sm:flex gap-2 font-bold" onClick={() => navigate(`${dashboardPath}/profile`)}>
                                    <User size={16} /> Profile
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
