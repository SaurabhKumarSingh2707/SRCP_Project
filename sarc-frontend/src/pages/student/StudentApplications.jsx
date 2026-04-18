import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Send, CheckCircle, Clock, XCircle, ArrowRight, FileText } from 'lucide-react';
import Button from '../../components/common/Button';

const StudentApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'ACCEPTED': return { color: 'green', icon: CheckCircle, text: 'Accepted' };
            case 'REJECTED': return { color: 'red', icon: XCircle, text: 'Rejected' };
            case 'SHORTLISTED': return { color: 'blue', icon: Clock, text: 'Shortlisted' };
            default: return { color: 'yellow', icon: Clock, text: 'Under Review' };
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 border-b border-primary/10 pb-6">
                <Badge text="Applications" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">My Applications</h1>
                <p className="text-slate-600 mt-2 text-lg">Track the status of your research project applications.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div><p className="text-slate-500 font-medium">Loading applications...</p></div></div>
            ) : applications.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center shadow-soft">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Send size={24} className="text-slate-400" /></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Applications Yet</h3>
                    <p className="text-slate-500 mb-6 max-w-md">You haven't applied to any research projects. Browse the directory to find projects matching your skills.</p>
                    <Button variant="primary" onClick={() => window.location.href = '/student/projects'}>Browse Projects</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {applications.map((app) => {
                        const statusConfig = getStatusConfig(app.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                            <Card key={app.id} className="relative overflow-hidden hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: `var(--color-${statusConfig.color}-500)` }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-slate-50 opacity-50 pointer-events-none rounded-bl-full"></div>
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border-${statusConfig.color}-200`}>
                                                <StatusIcon size={14} /> {statusConfig.text}
                                            </span>
                                            <span className="text-sm font-medium text-slate-400">Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold font-heading text-slate-900 mb-1">{app.project?.title}</h3>
                                        <p className="text-primary font-medium flex items-center gap-2 mb-4">
                                            Prof. {app.project?.faculty?.user?.fullName} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {app.project?.domain}
                                        </p>
                                        
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Message</p>
                                            <p className="text-sm text-slate-700 italic border-l-2 border-slate-300 pl-3">"{app.message}"</p>
                                        </div>
                                    </div>
                                    <div className="md:w-64 flex flex-col justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-6">
                                        {app.resumeFile && (
                                            <a href={`http://localhost:5000/uploads/${app.resumeFile}`} target="_blank" rel="noreferrer" className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-slate-700 hover:text-primary transition-colors text-sm font-bold rounded-lg shadow-sm">
                                                <FileText size={16} /> View Submitted Resume
                                            </a>
                                        )}
                                        <Button variant="outline" className="w-full gap-2" onClick={() => navigate(`/project/${app.projectId}`)}>View Project <ArrowRight size={16}/></Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentApplications;
