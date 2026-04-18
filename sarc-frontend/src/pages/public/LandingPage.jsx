import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    return (
        <div className="min-h-screen flex flex-col font-body">
            <Navbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative pt-32 pb-40 overflow-hidden bg-slate-900 border-b-4 border-secondary">
                    {/* Prestigious University Background image from banner */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                        style={{ backgroundImage: `url('/images/banner.jpg')` }}
                    ></div>
                    {/* Premium dark overlay to ensure text readability and pop */}
                    <div className="absolute inset-0 bg-black opacity-80 z-0 backdrop-blur-sm"></div>

                    {/* Decorative elegant elements */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent opacity-60 -z-10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-md">
                            Established 1987
                        </span>
                        <h1 className="mt-8 text-5xl md:text-6xl font-extrabold text-white font-heading tracking-tight leading-tight">
                            Sathyabama Research & <br className="hidden md:block" />
                            <span className="text-secondary">
                                Collaboration Portal
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-200">
                            Empowering Innovation Through Faculty–Student Collaboration. Our AI-driven engine connects Sathyabama's brightest minds to accelerate academic research.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="gradient" size="lg" className="shadow-lg shadow-primary/30" onClick={() => navigate('/auth')}>Explore Research Projects</Button>
                            <Button variant="secondary" size="lg" className="shadow-lg shadow-black/20 text-primary-dark" onClick={() => navigate('/register')}>Join as Student / Faculty</Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold font-heading text-primary">About SARC</h2>
                            <div className="h-1 w-20 bg-secondary mx-auto mt-4 rounded-full"></div>
                            <p className="mt-4 text-lg text-slate-600">Centralizing academic research and unlocking student potential across all departments.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={Zap}
                                title="AI-Based Project Matching"
                                description="Our proprietary algorithm matches students to prestigious university projects based on their skill profiles."
                            />
                            <FeatureCard
                                icon={Target}
                                title="Skill Gap Analyzer"
                                description="Identify exactly what skills you're missing for a project and get recommendations on how to acquire them."
                            />
                            <FeatureCard
                                icon={Users}
                                title="Team Formation System"
                                description="Easily scaffold cross-disciplinary teams. Find the perfect designer, engineer, or researcher from any department."
                            />
                            <FeatureCard
                                icon={Briefcase}
                                title="Industry Collaboration"
                                description="Bridge the gap between academia and industry. Connect with mentors actively seeking university research partnerships."
                            />
                            <FeatureCard
                                icon={TrendingUp}
                                title="Milestone Tracking"
                                description="Keep your research on track with built-in agile boards and milestone submission workflows."
                            />
                            <FeatureCard
                                icon={BookOpen}
                                title="Research Publication"
                                description="Streamlined workflows for drafting, reviewing, and publishing research papers alongside your faculty leads."
                            />
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className="py-20 bg-canvas">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl border border-primary-dark">
                            <div className="absolute inset-0 top-0 left-0 w-full h-full opacity-10 flex items-center justify-center">
                                {/* Subtle large letter S representing Sathyabama */}
                                <span className="text-[20rem] font-serif font-bold italic translate-y-8 select-none">S</span>
                            </div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 lg:divide-x divide-white/20">
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">240+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Active Projects</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">85+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Faculty Researchers</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">1,200+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Student Collaborators</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-5xl font-bold font-heading text-secondary mb-2">45+</div>
                                    <div className="text-white/80 font-medium uppercase tracking-wider text-sm">Industry Mentors</div>
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
