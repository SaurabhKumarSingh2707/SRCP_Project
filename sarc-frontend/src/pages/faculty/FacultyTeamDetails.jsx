import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Users, FileText, ArrowLeft, Award, Hash, BookOpen, Layers, CheckCircle2, LayoutTemplate } from 'lucide-react';
import Button from '../../components/common/Button';

const FacultyTeamDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const team = location.state?.team;

    if (!team) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <LayoutTemplate className="w-12 h-12 text-accent/50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-text-primary mb-2">Team Not Found</h2>
                    <p className="text-sm text-text-secondary mb-6">The details for this team could not be loaded. Please return to the dashboard and try again.</p>
                    <Button onClick={() => navigate('/faculty')} className="w-full">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-fade-in">
            {/* Minimalist Top Navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all shadow-sm"
                    title="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="hover:text-text-primary cursor-pointer transition-colors" onClick={() => navigate('/faculty')}>Dashboard</span>
                    <span className="text-border">/</span>
                    <span className="text-text-primary">Team Details</span>
                </div>
            </div>

            {/* Premium Header Banner */}
            <div className="relative bg-surface rounded-3xl p-8 sm:p-10 border border-border shadow-sm overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase tracking-wider border border-accent/20">
                                <Layers className="w-3.5 h-3.5" />
                                {team.domain}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas text-text-secondary font-semibold text-xs border border-border">
                                <Hash className="w-3.5 h-3.5" />
                                {team.id}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider border ${
                                team.status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                team.status === 'REQUESTED_GUIDE' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                team.status === 'FINALIZED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {team.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary leading-tight tracking-tight">
                            {team.name}
                        </h1>
                    </div>
                    
                    {team.abstractFile && (
                        <div className="shrink-0">
                            <a 
                                href={`${import.meta.env.VITE_API_URL}/uploads/${team.abstractFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-text-primary text-surface hover:bg-accent rounded-xl transition-all shadow-lg font-semibold text-sm w-full md:w-auto"
                            >
                                <FileText className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                View Project Abstract
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column (Wider) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Project Overview */}
                    <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Project Overview</h3>
                        </div>
                        <div className="prose prose-sm sm:prose-base max-w-none text-text-secondary leading-loose">
                            <p className="whitespace-pre-wrap">{team.description}</p>
                        </div>
                    </div>

                    {/* Team Roster */}
                    <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">Team Roster</h3>
                            </div>
                            <span className="inline-flex px-4 py-1.5 bg-canvas rounded-lg text-sm font-bold text-text-secondary border border-border shadow-sm">
                                {team.members?.filter(m => m.inviteStatus !== 'REJECTED').length || 0} Members
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.members?.filter(m => m.inviteStatus !== 'REJECTED').map((member) => (
                                <div key={member.id} className="group bg-canvas border border-border hover:border-accent/30 rounded-2xl p-5 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        {/* Profile Picture Wrapper */}
                                        <div className="relative">
                                            {member.isLeader && (
                                                <div className="absolute -top-3 -right-2 w-6 h-6 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-md border-2 border-surface z-10 text-[10px]" title="Team Leader">
                                                    👑
                                                </div>
                                            )}
                                            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-surface border-2 border-border group-hover:border-accent/50 transition-colors flex items-center justify-center shadow-sm relative z-0">
                                                {member.user?.profileImage ? (
                                                    <img src={`${import.meta.env.VITE_API_URL}${member.user.profileImage}`} alt={member.user?.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-bold text-accent">{member.user?.fullName?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="min-w-0 flex-1 pt-1">
                                            <p className="text-base font-bold text-text-primary truncate">
                                                {member.user?.fullName || 'Student'}
                                            </p>
                                            <p className="text-sm font-medium text-text-secondary mt-0.5 font-mono text-[13px]">{member.user?.registerNumber}</p>
                                            
                                            <div className="mt-3">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${
                                                    member.inviteStatus === 'ACCEPTED' ? 'bg-green-500/10 text-green-600' :
                                                    member.inviteStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                    {member.inviteStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Narrower) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Assigned Guide Card */}
                    {team.guide && (
                        <div className="bg-gradient-to-br from-surface to-surface border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] pointer-events-none"></div>
                            
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">
                                Assigned Guide
                            </h3>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-canvas border border-border flex items-center justify-center mb-4 shadow-sm relative">
                                    <Award className="w-8 h-8 text-accent" />
                                    <div className="absolute -bottom-2 bg-surface border border-border px-2 py-0.5 rounded-full shadow-sm">
                                        <span className="text-[10px] font-bold text-accent uppercase">Guide</span>
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-text-primary">{team.guide.fullName}</h4>
                                {team.selectionSource && (
                                    <p className="text-xs font-medium text-text-secondary mt-2 bg-canvas px-3 py-1 rounded-lg border border-border inline-block">
                                        {team.selectionSource === 'FACULTY' ? 'Selected by Faculty' : 'Selected by Student'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Evaluation Placeholder */}
                    <div className="bg-canvas border-2 border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center relative group hover:border-accent/30 transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Award className="w-8 h-8 text-text-secondary group-hover:text-accent transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-2">Marks & Evaluation</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Grading rubrics and evaluation tools for this team will be integrated here in future updates.
                        </p>
                        <div className="mt-6 w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-text-secondary/20 w-1/3 rounded-full"></div>
                        </div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-3">Coming Soon</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FacultyTeamDetails;
