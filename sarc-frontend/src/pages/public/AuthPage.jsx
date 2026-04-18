import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { User, Shield, Briefcase, GraduationCap } from 'lucide-react';

const RoleCard = ({ icon: Icon, title, description, role }) => {
    const navigate = useNavigate();

    return (
        <Card
            className="hover:border-primary/50 cursor-pointer group transition-all text-center flex flex-col items-center h-full"
            onClick={() => navigate(`/register?role=${role}`)}
        >
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:border-primary transition-colors">
                <Icon size={28} className="text-slate-500 group-hover:text-secondary transition-colors" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow">{description}</p>

            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                Continue
            </Button>
        </Card>
    );
};

const AuthPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('sarc_token');
        const role = localStorage.getItem('sarc_role');
        if (token && role) {
            if (role === 'FACULTY') navigate('/faculty');
            else if (role === 'ADMIN') navigate('/admin');
            else navigate('/student');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />

            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
                {/* University Background image from banner2 */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-40 fixed"
                    style={{ backgroundImage: `url('/images/banner2.jpg')` }}
                ></div>
                {/* Elegant light overlay to ensure card readability while keeping the background visible */}
                <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm z-0 fixed"></div>

                <div className="max-w-5xl w-full space-y-10 relative z-10">
                    <div className="text-center relative z-10">
                        {/* Decorative glow behind logo */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

                        <div className="inline-block p-4 md:p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-white shadow-soft mb-8 transition-transform hover:scale-105 duration-300">
                            <img
                                src="/images/SRCP_logo.png"
                                alt="SRCP Logo"
                                className="h-28 md:h-36 w-auto mx-auto object-contain mix-blend-multiply drop-shadow-sm"
                            />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
                            Welcome to the <br className="sm:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-accent">Sathyabama</span> SARC Portal
                        </h2>
                        <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto font-medium">
                            Please select your role to login or register for a new account.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <RoleCard
                            icon={GraduationCap}
                            title="Student Access"
                            description="Apply to research projects, manage teams, and analyze your skill gaps."
                            role="student"
                        />
                        <RoleCard
                            icon={Briefcase}
                            title="Faculty Portal"
                            description="Post new projects, review student applications, and track milestones."
                            role="faculty"
                        />
                        <RoleCard
                            icon={User}
                            title="Industry Mentor"
                            description="Partner with student teams to provide guidance and review publications."
                            role="industry"
                        />
                        <RoleCard
                            icon={Shield}
                            title="System Admin"
                            description="Monitor analytics, manage users, and review moderation flags."
                            role="admin"
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AuthPage;
