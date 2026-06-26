import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import { Target, Users, Zap, TrendingUp, BookOpen, Briefcase } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold font-heading text-slate-800 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed font-body">{description}</p>
    </div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        activeProjects: 0,
        facultyResearchers: 0,
        studentCollaborators: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Check if stats are already cached in the browser
                const cachedStats = sessionStorage.getItem('sarc_landing_stats');
                if (cachedStats) {
                    setStats(JSON.parse(cachedStats));
                    return; // Exit early, no network request needed!
                }

                // 2. If not cached, fetch from the backend
                const baseURL = import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${baseURL}/api/stats`);
                if (res.ok) {
                    const data = await res.json();
                    const newStats = {
                        activeProjects: data.activeProjects || 0,
                        facultyResearchers: data.facultyResearchers || 0,
                        studentCollaborators: data.studentCollaborators || 0
                    };
                    setStats(newStats);
                    
                    // 3. Save to browser cache for the next time
                    sessionStorage.setItem('sarc_landing_stats', JSON.stringify(newStats));
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };
        fetchStats();
    }, []);

    const role = localStorage.getItem('sarc_role');

    if (role) {
        if (role === 'FACULTY') return <Navigate to="/faculty" replace />;
        if (role === 'ADMIN') return <Navigate to="/admin" replace />;
        return <Navigate to="/student" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col font-body">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900 border-b-4 border-secondary">
                    {/* Prestigious University Background image from banner */}
                    <div className="absolute inset-0 z-0">
                        <picture>
                            <source media="(max-width: 768px)" srcSet="/images/banner_mobile.webp" />
                            <img 
                                src="/images/banner.webp" 
                                alt="Sathyabama University"
                                className="w-full h-full object-cover"
                                loading="eager"
                                fetchPriority="high"
                                width="1920"
                                height="1080"
                                decoding="async"
                            />
                        </picture>
                    </div>
                    {/* Premium dark overlay to ensure text readability and pop */}
                    <div className="absolute inset-0 bg-black opacity-80 z-0 backdrop-blur-sm"></div>

                    {/* Decorative elegant elements */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent opacity-60 -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-md">
                            Established 1987
                        </span>
                        <h1 className="mt-8 text-5xl md:text-6xl font-extrabold text-white font-heading tracking-tight leading-tight">
                            Sathyabama Research, Collaboration <br className="hidden md:block" />
                            <span className="text-secondary">
                                and Guide Selection Portal
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-200">
                            Empowering Innovation Through Faculty–Student Collaboration. Our AI-driven engine connects Sathyabama's brightest minds to accelerate academic research.
                        </p>
                        {!localStorage.getItem('sarc_role') ? (
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                                <Button variant="gradient" size="lg" className="shadow-lg shadow-primary/30" onClick={() => navigate('/login')}>Login to Portal</Button>
                            </div>
                        ) : (
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                                <Button variant="gradient" size="lg" className="shadow-lg shadow-primary/30" onClick={() => {
                                    const role = localStorage.getItem('sarc_role');
                                    if (role === 'FACULTY') navigate('/faculty');
                                    else if (role === 'ADMIN') navigate('/admin');
                                    else navigate('/student');
                                }}>Go to Dashboard</Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section id="about" className="py-20 scroll-mt-24 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold font-heading text-primary">About SARCG</h2>
                            <div className="h-1 w-20 bg-secondary mx-auto mt-4 rounded-full"></div>
                            <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                The Sathyabama Academic Research Collaboration and Guide Selection (SARCG) portal is designed to streamline the research journey for students and faculty. By centralizing project discovery, team formation, and guide allocation, we aim to foster an environment of cross-disciplinary innovation and academic excellence. SARCG bridges the gap between ambitious students and experienced faculty, ensuring every research project reaches its full potential.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={Zap}
                                title="Project Discovery & Application"
                                description="Browse and apply to prestigious university research projects that align with your academic goals and interests."
                            />
                            <FeatureCard
                                icon={Users}
                                title="Team Formation System"
                                description="Easily scaffold cross-disciplinary teams. Find the perfect designer, engineer, or researcher from any department."
                            />
                            <FeatureCard
                                icon={BookOpen}
                                title="Faculty Guide Allocation"
                                description="Streamlined workflows for students to select and collaborate with experienced faculty guides for their projects."
                            />
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className="py-20 bg-canvas">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl border border-primary-dark">
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                                {/* Elegant watermark */}
                                <span 
                                    className="text-[6rem] md:text-[9rem] font-serif font-bold italic tracking-widest select-none whitespace-nowrap text-white opacity-5 mix-blend-overlay"
                                >
                                    SATHYABAMA
                                </span>
                            </div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 lg:divide-x divide-white/20">
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">{stats.activeProjects.toLocaleString()}+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Active Projects</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">{stats.facultyResearchers.toLocaleString()}+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Faculty Researchers</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">{stats.studentCollaborators.toLocaleString()}+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Student Collaborators</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

// Elegant Badge Component Custom to Sathyabama Theme
const Badge = ({ text }) => (
    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-secondary/20 text-primary-dark border border-secondary shadow-sm">
        {text}
    </span>
);

export default LandingPage;
