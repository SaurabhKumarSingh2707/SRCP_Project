import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Calendar, MapPin, Users, Target, ArrowLeft, Download, Code, Hash, Layers, FileText, CheckCircle, Upload } from 'lucide-react';

const ProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyMessage, setApplyMessage] = useState('');
    const [applyResume, setApplyResume] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [applySuccess, setApplySuccess] = useState(false);

    useEffect(() => {
        const fetchProjectAndProfile = async () => {
            try {
                const token = localStorage.getItem('sarc_token');

                // Fetch Project
                const pRes = await fetch(`http://localhost:5000/api/projects/${id}`);
                const pData = await pRes.json();
                if (pRes.ok) setProject(pData);

                // Fetch User Profile
                const uRes = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const uData = await uRes.json();
                if (uRes.ok) setUserProfile(uData);

                // Fetch Applications to check status
                if (uData && uData.role === 'STUDENT') {
                    const appsRes = await fetch('http://localhost:5000/api/applications/student', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const appsData = await appsRes.json();
                    if (appsRes.ok) {
                        const existingApp = appsData.find(app => String(app.projectId) === String(id));
                        if (existingApp) {
                            setApplicationStatus(existingApp.status);
                        }
                    }
                }

            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjectAndProfile();
    }, [id]);

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const formData = new FormData();
            formData.append('projectId', id);
            formData.append('message', applyMessage);
            if (applyResume) formData.append('resumeFile', applyResume);

            const res = await fetch('http://localhost:5000/api/applications/apply', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setApplySuccess(true);
                setApplicationStatus('PENDING');
                setTimeout(() => setShowApplyModal(false), 2000);
            } else {
                alert("Failed to apply. You might have already applied.");
            }
        } catch (error) {
            console.error(error);
            alert("Error applying.");
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="min-h-screen pt-20 text-center">Loading Project Data...</div>;
    if (!project) return <div className="min-h-screen pt-20 text-center">Project not found</div>;

    const defaultProfilePhoto = "https://ui-avatars.com/api/?name=Prof&background=random";
    const bgImage = project.faculty?.profilePhoto ? `http://localhost:5000/uploads/${project.faculty.profilePhoto}` : defaultProfilePhoto;

    return (
        <div className="min-h-screen flex flex-col font-body bg-canvas">
            <Navbar />

            <main className="flex-grow py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <Link to="/student/projects" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Browse
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Detail */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-secondary/20 text-primary-dark border-secondary">
                                    Status: {project.status}
                                </span>
                                {project.domain && <Badge color="blue">{project.domain}</Badge>}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 mb-6 leading-tight">
                                {project.title}
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {project.description}
                            </p>

                            {project.problemStatement && (
                                <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold font-heading text-lg mb-2 flex items-center gap-2">
                                        <Hash size={18} className="text-primary" /> Problem Statement
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">{project.problemStatement}</p>
                                </div>
                            )}

                            {project.expectedOutcome && (
                                <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold font-heading text-lg mb-2 flex items-center gap-2">
                                        <Target size={18} className="text-primary" /> Expected Outcome
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">{project.expectedOutcome}</p>
                                </div>
                            )}
                        </div>

                        {/* Files & Tech Stack */}
                        <Card className="p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-slate-800 mb-4 flex items-center gap-2">
                                    <Code size={20} className="text-primary" /> Technologies & Skills
                                </h2>
                                <div className="space-y-4">
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Technologies Used</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies.map(t => <span key={t} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">{t}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    {project.skillsRequired && project.skillsRequired.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.skillsRequired.map(s => <Badge key={s} color="indigo">{s}</Badge>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold font-heading text-slate-800 mb-4 flex items-center gap-2">
                                    <Layers size={20} className="text-primary" /> Attachments
                                </h2>
                                <div className="space-y-3">
                                    {project.proposalFile ? (
                                        <a href={`http://localhost:5000/uploads/${project.proposalFile}`} target="_blank" download className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                            <Download size={18} className="text-slate-400" />
                                            <span className="font-medium text-sm text-slate-700">Project Proposal</span>
                                        </a>
                                    ) : <p className="text-sm text-slate-400 italic">No proposal attached</p>}

                                    {project.demoFile && (
                                        <a href={`http://localhost:5000/uploads/${project.demoFile}`} target="_blank" download className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                            <Download size={18} className="text-slate-400" />
                                            <span className="font-medium text-sm text-slate-700">Demo / PPT</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white border-0 shadow-lg relative overflow-hidden p-8">
                            {userProfile?.role === 'STUDENT' ? (
                                <>
                                    <h3 className="font-bold font-heading text-xl mb-4">Interested?</h3>
                                    {applicationStatus ? (
                                        <div className="bg-white/10 p-4 rounded-xl text-center border border-white/20">
                                            <p className="font-bold text-white mb-1 tracking-wide uppercase text-sm">Status</p>
                                            <p className={`font-bold font-heading text-lg ${applicationStatus === 'ACCEPTED' ? 'text-green-400' : applicationStatus === 'REJECTED' ? 'text-red-400' : 'text-primary'}`}>
                                                {applicationStatus}
                                            </p>
                                        </div>
                                    ) : (
                                        <Button onClick={() => setShowApplyModal(true)} variant="secondary" className="w-full py-4 text-primary-dark font-black tracking-wide shadow-xl hover:-translate-y-0.5" size="lg">
                                            Apply For Research
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <h3 className="font-bold font-heading text-xl mb-4 text-center">Faculty View</h3>
                            )}

                            {project.deadline && (
                                <p className="text-center text-sm text-white/60 mt-4 font-medium flex items-center justify-center gap-2">
                                    <Calendar size={14} /> Deadline: {new Date(project.deadline).toLocaleDateString()}
                                </p>
                            )}
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Faculty Supervisor</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <img src={bgImage} alt="Faculty" className="w-16 h-16 rounded-full border-2 border-primary/20 shadow-sm object-cover" />
                                <div>
                                    <h4 className="font-bold font-heading text-slate-900 text-lg">Prof. {project.faculty?.fullName}</h4>
                                    <p className="text-sm text-slate-500 font-medium">{project.faculty?.department || 'Sathyabama University'}</p>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4 pt-6 border-t border-slate-100">
                                {project.faculty?.designation && (
                                    <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                        <MapPin size={18} className="text-primary" /> {project.faculty.designation}
                                    </div>
                                )}
                                {project.numberOfStudents && (
                                    <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                        <Users size={18} className="text-primary" /> Seeking {project.numberOfStudents} Students
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Application Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold font-heading text-slate-900">Apply for Project</h2>
                            <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {applySuccess ? (
                            <div className="p-12 text-center text-green-600">
                                <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                                <h3 className="text-2xl font-bold font-heading">Application Submitted!</h3>
                                <p className="text-slate-500 mt-2">The faculty member will review your profile.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleApply} className="p-6 space-y-5">
                                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 mb-6">
                                    Your <strong>Name, Department, Skills</strong>, and <strong>Default Resume</strong> will be automatically attached to this application from your profile.
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Why are you interested in this project?</label>
                                    <textarea
                                        required
                                        value={applyMessage}
                                        onChange={(e) => setApplyMessage(e.target.value)}
                                        placeholder="Explain your motivation and relevance..."
                                        rows={4}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Attach Specific Resume (Optional)</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span></p>
                                                <p className="text-xs text-slate-400">PDF or DOCX (Max 5MB)</p>
                                                {applyResume && <p className="mt-2 text-sm font-semibold text-primary">{applyResume.name}</p>}
                                            </div>
                                            <input type="file" className="hidden" onChange={(e) => setApplyResume(e.target.files[0])} accept=".pdf,.doc,.docx" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Leave blank to use the resume from your profile.</p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                                    <Button type="submit" disabled={applying}>{applying ? 'Submitting...' : 'Submit Application'}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProjectDetail;
