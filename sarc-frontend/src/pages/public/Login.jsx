import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Calendar, User } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [loginType, setLoginType] = useState('STUDENT'); // 'STUDENT' or 'STAFF'
    const [formData, setFormData] = useState({ email: '', password: '', registerNumber: '', dateOfBirth: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isSubmitting = React.useRef(false);

    const role = localStorage.getItem('sarc_role');

    useEffect(() => {
        if (role) {
            if (role === 'FACULTY') navigate('/faculty', { replace: true });
            else if (role === 'ADMIN') navigate('/admin', { replace: true });
            else navigate('/student', { replace: true });
        }
    }, [navigate, role]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDobChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 8) val = val.substring(0, 8);
        
        let formatted = val;
        if (val.length > 4) {
            formatted = val.substring(0, 2) + '-' + val.substring(2, 4) + '-' + val.substring(4, 8);
        } else if (val.length > 2) {
            formatted = val.substring(0, 2) + '-' + val.substring(2, 4);
        }
        setFormData({ ...formData, dateOfBirth: formatted });
    };

    const handleCalendarSelect = (e) => {
        // Native date picker returns YYYY-MM-DD
        const val = e.target.value;
        if (val) {
            const parts = val.split('-');
            if (parts.length === 3) {
                // Convert to DD-MM-YYYY for our text input
                setFormData({ ...formData, dateOfBirth: `${parts[2]}-${parts[1]}-${parts[0]}` });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting.current) return;
        isSubmitting.current = true;

        setError('');
        setLoading(true);
        try {
            let dobPayload = formData.dateOfBirth;
            if (loginType === 'STUDENT' && dobPayload) {
                const parts = dobPayload.split('-');
                if (parts.length === 3) {
                    dobPayload = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD-MM-YYYY to YYYY-MM-DD
                }
            }

            const payload = loginType === 'STUDENT'
                ? { loginType: 'STUDENT', registerNumber: formData.registerNumber, dateOfBirth: dobPayload }
                : { loginType: 'STAFF', email: formData.email, password: formData.password };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('sarc_role', data.user.role || (data.user.isFaculty ? 'FACULTY' : 'STUDENT'));
                localStorage.setItem('sarc_isFirstLogin', data.user.isFirstLogin ? 'true' : 'false');

                if (data.user.isFirstLogin) {
                    navigate('/change-password');
                } else if (data.user.role === 'FACULTY') {
                    navigate('/faculty');
                } else if (data.user.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/student');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again later.');
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    if (role) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20 fixed"
                    style={{ backgroundImage: `url('/images/banner2.webp')` }}
                ></div>
                <div className="absolute inset-0 bg-canvas/90 backdrop-blur-sm z-0 fixed"></div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold font-heading text-slate-900">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Please sign in to your SARCG account
                        </p>
                    </div>

                    <Card className="mt-8">
                        <div className="flex justify-center mb-6 border-b border-slate-200">
                            <button
                                className={`pb-2 px-4 text-sm font-medium transition-colors ${loginType === 'STUDENT' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setLoginType('STUDENT'); setError(''); }}
                            >
                                Student Login
                            </button>
                            <button
                                className={`pb-2 px-4 text-sm font-medium transition-colors ${loginType === 'STAFF' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => { setLoginType('STAFF'); setError(''); }}
                            >
                                Staff Login
                            </button>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {loginType === 'STUDENT' ? (
                                <>
                                    <div>
                                        <label htmlFor="registerNumber" className="block text-sm font-medium text-slate-700 mb-1">Register Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                id="registerNumber"
                                                type="text"
                                                name="registerNumber"
                                                value={formData.registerNumber}
                                                onChange={handleChange}
                                                className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                placeholder="e.g. 41150001"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                        <div className="relative">
                                            <input
                                                id="dateOfBirth"
                                                type="text"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleDobChange}
                                                className="appearance-none block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                placeholder="DD-MM-YYYY"
                                                maxLength={10}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <Calendar className="h-5 w-5 text-slate-400" />
                                                <input
                                                    aria-label="Select Date from Calendar"
                                                    type="date"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleCalendarSelect}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                placeholder="you@sathyabama.ac.in"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button type="submit" className="w-full flex justify-center group" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
