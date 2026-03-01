import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { BookOpen, Users, BellRing, UserPlus, CheckCircle, FileText, X } from 'lucide-react';

const FacultyDashboard = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        skillsRequired: '',
        deadline: ''
    });

    useEffect(() => {
        fetchMyProjects();
    }, []);

    const fetchMyProjects = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            // Reusing getProjects but we'll fetch all and filter in frontend for simplicity
            // In a real app we'd have a specific /api/projects/me route
            const response = await fetch('http://localhost:5000/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Just get my own user id to match
            const userRes = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            if (response.ok && userRes.ok) {
                const myProjects = data.filter(p => p.facultyId === userData.id);
                setProjects(myProjects);
            }
        } catch (error) {
            console.error("Error fetching projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const skillsArray = formData.skillsRequired.split(',').map(s => s.trim()).filter(s => s);

            const response = await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    skillsRequired: skillsArray,
                    deadline: formData.deadline
                })
            });

            if (response.ok) {
                setIsCreateModalOpen(false);
                setFormData({ title: '', description: '', skillsRequired: '', deadline: '' });
                fetchMyProjects(); // Refresh list
            }
        } catch (error) {
            console.error("Error creating project", error);
        }
    };
    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-primary/10 pb-6">
                <div>
                    <Badge text="Faculty Portal" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Faculty Workspace</h1>
                    <p className="text-slate-600 mt-2 text-lg">Manage your active Sathyabama research projects and evaluate applicants.</p>
                </div>
                <Button variant="gradient" className="gap-2 shadow-md" onClick={() => setIsCreateModalOpen(true)}>
                    <BookOpen size={18} /> Post New Project
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatWidget title="Total Open Projects" value="3" icon={BookOpen} trend={0} />
                <StatWidget title="Pending Applications" value="12" icon={BellRing} trend={5} />
                <StatWidget title="Approved Teams" value="2" icon={Users} trend={2} />
            </div>

            {/* Active Projects Table */}
            <Card className="mb-8 overflow-hidden p-0 border-t-4 border-t-secondary shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-canvas/30">
                    <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3">
                        <CheckCircle size={24} className="text-primary" /> Active Research Projects
                    </h2>
                    <Button variant="ghost" size="sm" className="text-primary font-bold">View All Projects</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Project Title</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Required Skills</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Applicants</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 pb-2">
                            {loading ? (
                                <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading projects...</td></tr>
                            ) : projects.length > 0 ? (
                                projects.map(proj => (
                                    <tr key={proj.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">{proj.title}</td>
                                        <td className="py-5 px-6 text-sm text-slate-600">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {proj.skillsRequired.slice(0, 3).map((s, i) => (
                                                    <Badge key={i} color="blue">{s}</Badge>
                                                ))}
                                                {proj.skillsRequired.length > 3 && <Badge color="gray">+{proj.skillsRequired.length - 3}</Badge>}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-sm text-slate-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Users size={18} className="text-slate-400" />
                                                <span className="bg-slate-100 text-slate-600 py-1 px-2.5 rounded shadow-sm font-bold border border-slate-200">0</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <Button variant="ghost" size="sm" className="font-bold">Manage</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-10 text-center">
                                        <p className="text-slate-500 mb-4">You haven't posted any projects yet.</p>
                                        <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>Create One Now</Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Recent Applications Sidebar/Widget block */}
            <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3 mt-10">
                <UserPlus size={24} className="text-purple-600" /> Candidate Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { name: "Alice Smith", match: "94", proj: "ML Cancer Detection" },
                    { name: "Bob Johnson", match: "89", proj: "Networking Architecture" },
                    { name: "Charlie Delta", match: "85", proj: "ML Cancer Detection" },
                    { name: "Diana Prince", match: "76", proj: "Networking Architecture" },
                ].map((student, i) => (
                    <Card key={i} className="flex flex-col hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold font-heading text-primary text-sm">
                                {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold shadow-sm">
                                {student.match}% Match
                            </span>
                        </div>
                        <h4 className="font-bold font-heading text-slate-800 text-base">{student.name}</h4>
                        <p className="text-sm text-slate-500 mt-1 mb-6 line-clamp-2">Applied: <span className="font-medium text-slate-700">{student.proj}</span></p>
                        <div className="mt-auto grid grid-cols-2 gap-3">
                            <Button variant="outline" size="sm" className="w-full text-xs py-2 font-bold">Reject</Button>
                            <Button variant="primary" size="sm" className="w-full text-xs py-2 font-bold shadow-sm">Review</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-heading text-slate-900">Post New Project</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="Python, React, Data Analysis"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                    value={formData.skillsRequired}
                                    onChange={e => setFormData({ ...formData, skillsRequired: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary">Publish Project</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDashboard;
