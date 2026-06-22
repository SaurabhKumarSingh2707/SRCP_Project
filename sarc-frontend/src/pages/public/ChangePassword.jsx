import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Lock, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const isFirstLogin = localStorage.getItem('sarc_isFirstLogin');
        if (isFirstLogin !== 'true') {
            navigate('/student'); // Or appropriate dashboard based on role
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/force-change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('sarc_isFirstLogin', 'false');
                const role = localStorage.getItem('sarc_role');
                if (role === 'FACULTY') navigate('/faculty');
                else if (role === 'ADMIN') navigate('/admin');
                else navigate('/student');
            } else {
                setError(data.message || 'Failed to update password');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

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
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-8 w-8 text-amber-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold font-heading text-slate-900">
                            Action Required
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            You must change your default password to activate your account.
                        </p>
                    </div>

                    <Card className="mt-8 border-t-4 border-amber-500">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200 text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full flex justify-center group" disabled={loading}>
                                {loading ? 'Updating...' : 'Activate Account'}
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

export default ChangePassword;
