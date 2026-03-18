import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Briefcase, Clock, CheckCircle, AlertTriangle, ArrowRight, Send } from 'lucide-react';

const RecommendedProjectCard = ({ title, faculty, matchScore, skills, missingSkills }) => (
    <Card className="flex flex-col h-full border-l-4 border-l-primary hover:-translate-y-1 transition-transform">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-800 line-clamp-2 gap-2">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">Prof. {faculty}</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg flex flex-col items-center shadow-sm">
                <span className="text-sm leading-none">{matchScore}%</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-1">Match</span>
            </div>
        </div>

        <div className="mb-4 flex-grow">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Required Core Skills</p>
            <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                    <Badge key={skill} color="blue">{skill}</Badge>
                ))}
            </div>

            {missingSkills && missingSkills.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Skill Gap Warning</p>
                        <div className="flex flex-wrap gap-1">
                            {missingSkills.map(skill => (
                                <span key={skill} className="text-xs text-red-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-red-100">{skill}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Closes in 3 days</span>
            <Button variant="primary" size="sm" className="gap-2">
                View Details <ArrowRight size={16} />
            </Button>
        </div>
    </Card>
);

const StudentDashboard = () => {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch('http://localhost:5000/api/applications/student', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchApps();
    }, []);

    return (
        <DashboardLayout>
            <div className="mb-8">
                <Badge text="Class of 2026" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Student Dashboard</h1>
                <p className="text-slate-600 mt-2 text-lg">Welcome back. Here is your academic research and collaboration overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatWidget title="Applications Sent" value={applications.length.toString()} icon={Send} trend={applications.length > 0 ? 5 : 0} />
                <StatWidget title="Accepted Projects" value={applications.filter(a => a.status === 'ACCEPTED').length.toString()} icon={CheckCircle} />
                <StatWidget title="Pending Reviews" value={applications.filter(a => a.status === 'PENDING').length.toString()} icon={Clock} />
            </div>

            <div className="mb-8 bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800">AI Recommended Projects</h2>
                        <p className="text-sm text-slate-500 mt-1">Sathyabama projects matched to your skill profile</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">View Directory <ArrowRight size={16} /></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RecommendedProjectCard
                        title="Machine Learning for Early Cancer Detection"
                        faculty="Sarah Jenkins"
                        matchScore={92}
                        skills={['Python', 'PyTorch', 'Data Analysis']}
                    />
                    <RecommendedProjectCard
                        title="Blockchain-Based Voting System Prototype"
                        faculty="Dr. Alan Turing"
                        matchScore={78}
                        skills={['Solidity', 'React', 'Node.js']}
                        missingSkills={['Solidity']}
                    />
                    <RecommendedProjectCard
                        title="Optimizing Cloud Infrastructure Metrics"
                        faculty="Prof. Linus"
                        matchScore={65}
                        skills={['AWS', 'Docker', 'Go']}
                        missingSkills={['Go', 'AWS']}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Application Statuses */}
                <Card className="border-t-4 border-t-secondary shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Active Applications
                    </h2>
                    <div className="space-y-4">
                        {applications.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-sm">You haven't applied to any projects yet.</div>
                        ) : (
                            applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-slate-200 hover:border-primary/30 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-bold text-slate-800 font-heading truncate" title={app.project?.title}>{app.project?.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">Prof. {app.project?.faculty?.user?.fullName} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`inline-flex flex-shrink-0 items-center px-3 py-1 rounded-full text-xs font-bold border ${app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-200' : app.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                        {app.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="border-t-4 border-t-red-500 shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                        <Clock size={24} className="text-red-500" /> Upcoming Deadlines
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 border border-red-100 bg-red-50 rounded-xl hover:shadow-sm transition-shadow">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100 text-center min-w-[70px] flex flex-col justify-center">
                                <span className="block text-xs font-bold text-red-500 uppercase tracking-widest">Oct</span>
                                <span className="block text-2xl font-black text-slate-900">24</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="font-bold text-slate-900 text-lg">Submit Project Proposal</h4>
                                <p className="text-sm text-slate-600 mt-1 font-medium">Blockchain Voting System</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 border border-slate-200 bg-canvas rounded-xl hover:shadow-sm transition-shadow">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center min-w-[70px] flex flex-col justify-center">
                                <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Nov</span>
                                <span className="block text-2xl font-black text-slate-900">12</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="font-bold text-slate-900 text-lg">Mid-Semester Review</h4>
                                <p className="text-sm text-slate-600 mt-1 font-medium">General requirement</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
