import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Calendar, MapPin, Users, Award, Target, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';

const ProjectDetail = () => {
    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />

            <main className="flex-grow py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                {/* Back navigation */}
                <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Sathyabama Research Directory
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Main Content) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">Accepting Applications</span>
                                <Badge color="blue">Machine Learning</Badge>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 mb-6 leading-tight">
                                Machine Learning for Early Cancer Detection
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                This research project aims to develop a robust, lightweight deep learning model capable of analyzing thousands of histopathology scans to identify early markers of cellular mutation associated with pancreatic cancer, running inference on edge devices in under-resourced clinics.
                            </p>
                        </div>

                        <Card className="p-8 shadow-sm">
                            <h2 className="text-2xl font-bold font-heading text-slate-800 mb-6">Project Goals & Milestones</h2>
                            <ul className="space-y-8 text-slate-600">
                                <li className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">1</div>
                                    <div>
                                        <h4 className="font-bold font-heading text-slate-800 text-lg">Dataset Aggregation</h4>
                                        <p className="text-base mt-2 leading-relaxed">Collect and clean over 50,000 open-source medical scans. Standardize resolutions and formats.</p>
                                    </div>
                                </li>
                                <li className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-md text-lg">2</div>
                                    <div>
                                        <h4 className="font-bold font-heading text-slate-800 text-lg flex items-center gap-3">
                                            Base Model Training
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/20 text-primary-dark uppercase tracking-widest border border-secondary/50">Current</span>
                                        </h4>
                                        <p className="text-base mt-2 leading-relaxed">Implement a ResNet50 baseline and begin modifying attention layers for micro-anomaly detection.</p>
                                    </div>
                                </li>
                                <li className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-lg">3</div>
                                    <div>
                                        <h4 className="font-bold font-heading text-slate-400 text-lg">Edge Device Optimization</h4>
                                        <p className="text-base mt-2 leading-relaxed text-slate-400">Quantize the model and test latency on Raspberry Pi 4 and Jetson Nano.</p>
                                    </div>
                                </li>
                            </ul>
                        </Card>
                    </div>

                    {/* Right Column (Sidebar Setup) */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-primary to-primary-dark text-white border-0 shadow-lg relative overflow-hidden p-8">
                            {/* Decorative S */}
                            <div className="absolute -top-10 -right-10 text-[10rem] font-serif font-bold italic text-white opacity-5 select-none pointer-events-none">
                                S
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-bold font-heading text-xl mb-6 flex items-center gap-3">
                                    <Target size={24} className="text-secondary" /> Your Skill Match
                                </h3>

                                <div className="text-center mb-6">
                                    <span className="text-6xl font-black text-secondary tracking-tight">78<span className="text-3xl">%</span></span>
                                </div>

                                {/* Skill Gap Section */}
                                <div className="bg-black/20 rounded-xl p-5 mb-8 border border-white/10 backdrop-blur-sm">
                                    <p className="text-xs text-white/70 mb-4 font-bold uppercase tracking-widest">Skills Analysis</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-secondary" /> Python</span>
                                            <span className="text-secondary font-bold">Matched</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-secondary" /> PyTorch</span>
                                            <span className="text-secondary font-bold">Matched</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm bg-red-500/30 p-2.5 rounded border border-red-500/50">
                                            <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-white" /> Edge/IoT</span>
                                            <span className="text-white font-bold tracking-wide">Missing Gap</span>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="secondary" className="w-full py-4 text-primary-dark font-black tracking-wide shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5" size="lg">
                                    Apply For Research
                                </Button>
                                <p className="text-center text-sm text-white/60 mt-4 font-medium">Application closes on Nov 15th, 2026</p>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Faculty Supervisor</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl font-heading shadow-sm">
                                    SJ
                                </div>
                                <div>
                                    <h4 className="font-bold font-heading text-slate-900 text-lg">Dr. Sarah Jenkins</h4>
                                    <p className="text-sm text-slate-500 font-medium">Computer Science Dept.</p>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <MapPin size={18} className="text-primary" /> Science Building, Room 402
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <Users size={18} className="text-primary" /> 2 Students Currently
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                    <Award size={18} className="text-secondary" /> 3 Academic Credits
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProjectDetail;
