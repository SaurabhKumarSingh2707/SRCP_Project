import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/common/Button';

const FacultyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const aRes = await fetch('http://localhost:5000/api/applications/faculty', { headers: { 'Authorization': `Bearer ${token}` } });
            if (aRes.ok) {
                const aData = await aRes.json();
                setApplications(aData);
            }
        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateApplicationStatus = async (appId, newStatus) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 border-b border-primary/10 pb-6">
                <Badge text="Application Management" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Student Applications</h1>
                <p className="text-slate-600 mt-2 text-lg">Review and manage incoming student applications for your projects.</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading applications...</div>
            ) : applications.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center">
                    <Users size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No Applications</h3>
                    <p className="text-slate-500 mt-2">You haven't received any new applications yet.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {applications.map(app => (
                        <div key={app.id} className={`p-6 rounded-2xl border-l-4 ${app.status === 'PENDING' ? 'border-yellow-400 bg-white shadow-md border-y border-r border-slate-200' : app.status === 'ACCEPTED' ? 'border-green-500 bg-green-50/30' : app.status === 'SHORTLISTED' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 bg-slate-50'} transition-all`}>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 relative">
                                    <img src={app.student?.user?.profilePhoto ? `http://localhost:5000/uploads/${app.student.user.profilePhoto}` : `https://ui-avatars.com/api/?name=${app.student?.user?.fullName}&background=random`} alt="Student" className="w-20 h-20 rounded-2xl border-4 border-white shadow-sm object-cover" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-extrabold text-xl text-slate-900 font-heading">{app.student?.user?.fullName}</h3>
                                            <p className="text-sm font-bold text-primary px-3 py-1 bg-primary/5 rounded-full inline-block mt-1 border border-primary/10">Project: {app.project?.title}</p>
                                        </div>
                                        <Badge color={app.status === 'ACCEPTED' ? 'green' : app.status === 'REJECTED' ? 'red' : app.status === 'SHORTLISTED' ? 'blue' : 'yellow'} className="shadow-sm">
                                            {app.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 my-4 max-w-md">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                            <p className="text-sm font-medium text-slate-700">{app.student?.department || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year of Study</p>
                                            <p className="text-sm font-medium text-slate-700">{app.student?.yearOfStudy || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-canvas p-4 rounded-xl border border-slate-200/60 mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={12}/> Student Message</p>
                                        <p className="text-sm text-slate-700 italic border-l-2 border-slate-300 pl-3">"{app.message}"</p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-4 items-center">
                                        {(app.resumeFile || app.student?.resumeFile) && (
                                            <a href={`http://localhost:5000/uploads/${app.resumeFile || app.student?.resumeFile}`} target="_blank" download className="text-sm font-bold text-primary hover:text-primary-dark hover:bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 transition-colors flex items-center gap-2">
                                                <FileText size={16} /> Download Resume
                                            </a>
                                        )}
                                        {app.student?.skills && app.student.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-2">Skills:</span>
                                                {app.student.skills.slice(0, 5).map(skill => <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-600 font-medium text-xs rounded-md border border-slate-200">{skill}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 md:w-56 items-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 pl-0 md:pl-6">
                                    {app.status === 'PENDING' && (
                                        <div className="flex w-full flex-col gap-3">
                                            <Button onClick={() => handleUpdateApplicationStatus(app.id, 'SHORTLISTED')} variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 font-bold">Shortlist</Button>
                                            <Button onClick={() => handleUpdateApplicationStatus(app.id, 'ACCEPTED')} variant="primary" className="w-full shadow-md font-bold">Accept Candidate</Button>
                                            <Button onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')} variant="danger" className="w-full font-bold">Reject</Button>
                                        </div>
                                    )}
                                    {app.status === 'SHORTLISTED' && (
                                        <div className="flex w-full flex-col gap-3">
                                            <Button onClick={() => handleUpdateApplicationStatus(app.id, 'ACCEPTED')} variant="primary" className="w-full shadow-md font-bold">Accept Candidate</Button>
                                            <Button onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')} variant="danger" className="w-full font-bold">Reject</Button>
                                        </div>
                                    )}
                                    {app.status === 'ACCEPTED' && (
                                        <div className="w-full text-center p-4 bg-green-50 rounded-xl border border-green-200 flex flex-col items-center">
                                            <CheckCircle className="text-green-500 mb-2" size={32}/>
                                            <span className="font-bold text-green-700 block">Candidate Accepted</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyApplications;
