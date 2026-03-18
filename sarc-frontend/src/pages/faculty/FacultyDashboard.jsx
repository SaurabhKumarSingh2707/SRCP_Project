import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { BookOpen, Users, BellRing, UserPlus, CheckCircle, FileText, X, Upload } from 'lucide-react';

const FacultyDashboard = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateIdeaModalOpen, setIsCreateIdeaModalOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '', description: '', skillsRequired: '', deadline: '',
        domain: '', problemStatement: '', technologies: '', expectedOutcome: '', numberOfStudents: ''
    });

    const [ideaData, setIdeaData] = useState({
        title: '', description: '', suggestedTechnologies: '',
        difficultyLevel: 'Beginner', skillsRequired: '', numberOfStudents: ''
    });

    const [files, setFiles] = useState({
        proposalFile: null, documentationFile: null, demoFile: null, supportingFile: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const userRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
            const userData = await userRes.json();

            const pRes = await fetch('http://localhost:5000/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
            const pData = await pRes.json();

            const iRes = await fetch('http://localhost:5000/api/projects/ideas', { headers: { 'Authorization': `Bearer ${token}` } });
            const iData = await iRes.json();

            const aRes = await fetch('http://localhost:5000/api/applications/faculty', { headers: { 'Authorization': `Bearer ${token}` } });
            const aData = await aRes.json();

            if (pRes.ok && userRes.ok) {
                setProjects(pData.filter(p => p.facultyId === userData.facultyProfile?.id));
            }
            if (iRes.ok && userRes.ok) {
                setIdeas(iData.filter(i => i.facultyId === userData.facultyProfile?.id));
            }
            if (aRes.ok) setApplications(aData);
        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const submitData = new FormData();
            Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
            if (files.proposalFile) submitData.append('proposalFile', files.proposalFile);
            if (files.documentationFile) submitData.append('documentationFile', files.documentationFile);
            if (files.demoFile) submitData.append('demoFile', files.demoFile);

            const response = await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: submitData
            });

            if (response.ok) {
                setIsCreateModalOpen(false);
                setFormData({ title: '', description: '', skillsRequired: '', deadline: '', domain: '', problemStatement: '', technologies: '', expectedOutcome: '', numberOfStudents: '' });
                setFiles({ ...files, proposalFile: null, documentationFile: null, demoFile: null });
                fetchData();
            }
        } catch (error) {
            console.error("Error creating project", error);
        }
    };

    const handleCreateIdea = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const submitData = new FormData();
            Object.keys(ideaData).forEach(key => submitData.append(key, ideaData[key]));
            if (files.supportingFile) submitData.append('supportingFile', files.supportingFile);

            const response = await fetch('http://localhost:5000/api/projects/ideas', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: submitData
            });

            if (response.ok) {
                setIsCreateIdeaModalOpen(false);
                setIdeaData({ title: '', description: '', suggestedTechnologies: '', difficultyLevel: 'Beginner', skillsRequired: '', numberOfStudents: '' });
                setFiles({ ...files, supportingFile: null });
                fetchData();
            }
        } catch (error) {
            console.error("Error creating idea", error);
        }
    };

    const handleUpdateApplicationStatus = async (appId, newStatus) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchData(); // Refresh list immediately
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-primary/10 pb-6">
                <div>
                    <Badge text="Faculty Portal" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Faculty Workspace</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage your active research projects and project ideas.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 shadow-md bg-white" onClick={() => setIsCreateIdeaModalOpen(true)}>
                        <FileText size={18} /> Post Idea
                    </Button>
                    <Button variant="gradient" className="gap-2 shadow-md" onClick={() => setIsCreateModalOpen(true)}>
                        <BookOpen size={18} /> Post Project
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatWidget title="Total Open Projects" value={projects.length.toString()} icon={BookOpen} trend={0} />
                <StatWidget title="Project Ideas" value={ideas.length.toString()} icon={FileText} trend={2} />
                <StatWidget title="Pending Applications" value={applications.filter(a => a.status === 'PENDING').length.toString()} icon={BellRing} trend={1} />
            </div>

            {/* Active Projects Table */}
            <Card className="mb-8 overflow-hidden p-0 border-t-4 border-t-secondary shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-canvas/30">
                    <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Active Research Projects
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Project Title</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Domain</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Students Needed</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 pb-2">
                            {loading ? (
                                <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading projects...</td></tr>
                            ) : projects.length > 0 ? (
                                projects.map(proj => (
                                    <tr key={proj.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">{proj.title}</td>
                                        <td className="py-5 px-6 text-sm text-slate-600 font-medium">{proj.domain || 'N/A'}</td>
                                        <td className="py-5 px-6 text-sm text-slate-600 font-medium">{proj.numberOfStudents || 'Not specified'}</td>
                                        <td className="py-5 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">
                                                {proj.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center text-slate-500">You haven't posted any projects yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Application Management */}
            <Card className="mb-8 p-0 overflow-hidden shadow-md">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3">
                        <Users size={24} className="text-primary" /> Student Applications
                    </h2>
                    <p className="text-sm text-slate-500 mt-2">Manage applications for all your active projects.</p>
                </div>
                <div className="p-6">
                    {applications.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No applications received yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {applications.map(app => (
                                <div key={app.id} className={`p-5 rounded-xl border ${app.status === 'PENDING' ? 'border-yellow-200 bg-yellow-50' : app.status === 'ACCEPTED' ? 'border-green-200 bg-green-50' : app.status === 'SHORTLISTED' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'} shadow-sm`}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-shrink-0 relative">
                                            <img src={app.student?.user?.profilePhoto ? `http://localhost:5000/uploads/${app.student.user.profilePhoto}` : `https://ui-avatars.com/api/?name=${app.student?.user?.fullName}&background=random`} alt="Student" className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
                                            {app.status === 'PENDING' && <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-white rounded-full"></span>}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-900">{app.student?.user?.fullName}</h3>
                                                    <p className="text-sm font-medium text-primary">Applied for: {app.project?.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{app.student?.department} | {app.student?.yearOfStudy}</p>
                                                </div>
                                                <Badge color={app.status === 'ACCEPTED' ? 'green' : app.status === 'REJECTED' ? 'red' : app.status === 'SHORTLISTED' ? 'blue' : 'yellow'}>{app.status}</Badge>
                                            </div>

                                            <div className="mt-4 bg-white/60 p-3 rounded-lg border border-slate-200/50">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Interest Message</p>
                                                <p className="text-sm text-slate-700 italic">"{app.message}"</p>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-4 items-center">
                                                {(app.resumeFile || app.student?.resumeFile) && (
                                                    <a href={`http://localhost:5000/uploads/${app.resumeFile || app.student?.resumeFile}`} target="_blank" download className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                                        <FileText size={16} /> View Resume
                                                    </a>
                                                )}
                                                {app.student?.skills && app.student.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 line-clamp-1 flex-1">
                                                        <span className="text-xs font-medium text-slate-400 pr-2 border-r border-slate-300">Skills</span>
                                                        {app.student.skills.slice(0, 3).map(skill => <span key={skill} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">{skill}</span>)}
                                                        {app.student.skills.length > 3 && <span className="text-xs text-slate-400">+{app.student.skills.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 md:w-48 items-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 pl-0 md:pl-6 mt-4 md:mt-0">
                                            {app.status === 'PENDING' && (
                                                <div className="flex w-full flex-col gap-2">
                                                    <Button onClick={() => handleUpdateApplicationStatus(app.id, 'SHORTLISTED')} variant="outline" size="sm" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50">Shortlist</Button>
                                                    <Button onClick={() => handleUpdateApplicationStatus(app.id, 'ACCEPTED')} variant="primary" size="sm" className="w-full">Accept</Button>
                                                    <Button onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')} variant="danger" size="sm" className="w-full mt-2">Reject</Button>
                                                </div>
                                            )}
                                            {app.status === 'SHORTLISTED' && (
                                                <div className="flex w-full flex-col gap-2">
                                                    <Button onClick={() => handleUpdateApplicationStatus(app.id, 'ACCEPTED')} variant="primary" size="sm" className="w-full">Accept</Button>
                                                    <Button onClick={() => handleUpdateApplicationStatus(app.id, 'REJECTED')} variant="danger" size="sm" className="w-full mt-2">Reject</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2 border-b border-slate-100">
                            <h2 className="text-2xl font-bold font-heading text-slate-900">Post New Project</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4 pb-12">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Project Title</label>
                                    <input type="text" required className="w-full p-2 border border-slate-300 rounded-lg" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>

                                <div><label className="block text-sm font-medium mb-1">Domain</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} /></div>

                                <div><label className="block text-sm font-medium mb-1">Technologies Used</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })} placeholder="e.g. React, Python" /></div>

                                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Detailed Description</label>
                                    <textarea required rows={4} className="w-full p-2 border border-slate-300 rounded-lg" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>

                                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Problem Statement</label>
                                    <textarea rows={2} className="w-full p-2 border border-slate-300 rounded-lg" value={formData.problemStatement} onChange={e => setFormData({ ...formData, problemStatement: e.target.value })} /></div>

                                <div><label className="block text-sm font-medium mb-1">Required Skills</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.skillsRequired} onChange={e => setFormData({ ...formData, skillsRequired: e.target.value })} /></div>

                                <div><label className="block text-sm font-medium mb-1">Number of Students Required</label>
                                    <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.numberOfStudents} onChange={e => setFormData({ ...formData, numberOfStudents: e.target.value })} /></div>

                                <div className="col-span-2 mt-4"><label className="block text-sm font-medium mb-1 font-bold text-primary">Upload Attachments</label></div>
                                <div><label className="block text-xs font-medium mb-1 text-slate-500">Project Proposal (PDF/DOC)</label>
                                    <input type="file" className="text-sm p-1" onChange={e => setFiles({ ...files, proposalFile: e.target.files[0] })} /></div>
                                <div><label className="block text-xs font-medium mb-1 text-slate-500">Project Demo/PPT</label>
                                    <input type="file" className="text-sm p-1" onChange={e => setFiles({ ...files, demoFile: e.target.files[0] })} /></div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Publish Project</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Create Idea Modal */}
            {isCreateIdeaModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-heading text-slate-900">Post New Project Idea</h2>
                            <button onClick={() => setIsCreateIdeaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateIdea} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Idea Title</label>
                                <input type="text" required className="w-full p-2 border border-slate-300 rounded-lg" value={ideaData.title} onChange={e => setIdeaData({ ...ideaData, title: e.target.value })} /></div>
                            <div><label className="block text-sm font-medium mb-1">Description</label>
                                <textarea required rows={4} className="w-full p-2 border border-slate-300 rounded-lg" value={ideaData.description} onChange={e => setIdeaData({ ...ideaData, description: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Suggested Technologies</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={ideaData.suggestedTechnologies} onChange={e => setIdeaData({ ...ideaData, suggestedTechnologies: e.target.value })} /></div>
                                <div><label className="block text-sm font-medium mb-1">Difficulty Level</label>
                                    <select className="w-full p-2 border border-slate-300 rounded-lg" value={ideaData.difficultyLevel} onChange={e => setIdeaData({ ...ideaData, difficultyLevel: e.target.value })}>
                                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                    </select></div>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Upload Supporting File (Optional)</label>
                                <input type="file" className="text-sm p-1" onChange={e => setFiles({ ...files, supportingFile: e.target.files[0] })} /></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateIdeaModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Post Idea</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDashboard;
