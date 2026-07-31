import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, Badge, StatWidget } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Briefcase, Clock, CheckCircle, AlertTriangle, ArrowRight, Send, Users, Compass, ChevronDown, ChevronUp, Info, ChevronRight } from 'lucide-react';


const StudentDashboard = () => {

    const { data: dashboardData, isLoading: loading } = useQuery({
        queryKey: ['studentDashboard'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [resDeadlines, resPhase, resSystem, resTeam] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/global-milestones`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, { headers })
            ]);

            let allMilestones = [];
            let upcomingDeadlines = [];
            let phase = 'CLOSED';
            let instructions = [];
            let systemConfig = null;
            let team = null;

            if (resDeadlines.ok) {
                allMilestones = await resDeadlines.json();
                upcomingDeadlines = allMilestones
                    .filter(d => d.status !== 'COMPLETED')
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 3);
            }

            if (resPhase.ok) {
                const pData = await resPhase.json();
                phase = pData.phase || 'CLOSED';
            }

            if (resSystem.ok) {
                systemConfig = await resSystem.json();
                instructions = systemConfig.phaseOneInstructions || [];
            }
            
            if (resTeam.ok) {
                team = await resTeam.json();
            }

            return { allMilestones, deadlines: upcomingDeadlines, phase, instructions, systemConfig, team };
        },
        staleTime: 5 * 60 * 1000
    });

    const { deadlines = [], allMilestones = [], phase = 'CLOSED', instructions = [], systemConfig = null, team = null } = dashboardData || {};

    const [isInstructionsOpen, setIsInstructionsOpen] = React.useState(false);

    const getPhaseInfo = (currentPhase) => {
        switch (currentPhase) {
            case 'CLOSED':
                return {
                    title: 'Phase 1: Team Formation',
                    badge: 'Team Formation Active',
                    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
                    border: 'border-t-blue-500',
                    desc: 'Students are currently forming groups (up to 2 members) and submitting project details. Ensure your team details are finalized before the next phase.',
                    btnText: 'Manage Project Team',
                    btnPath: '/guide/team/my',
                    icon: <Users size={24} className="text-blue-500" />
                };
            case 'FACULTY_SELECTION':
                return {
                    title: 'Phase 2: Faculty Selection',
                    badge: 'Faculty Selection Active',
                    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
                    border: 'border-t-purple-500',
                    desc: 'Guides are currently reviewing finalized student teams and sending invitations. Check your project team page for incoming guide offers.',
                    btnText: 'View Team & Invites',
                    btnPath: '/guide/team/my',
                    icon: <Briefcase size={24} className="text-purple-500" />
                };
            case 'STUDENT_SELECTION':
                return {
                    title: 'Phase 3: Student Selection',
                    badge: 'Student Selection Active',
                    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    border: 'border-t-emerald-500',
                    desc: 'You can now browse available faculty members and select a guide for your project from those with open slots. Slots are limited, so act quickly!',
                    btnText: 'Select Your Guide',
                    btnPath: '/guide/select',
                    icon: <Compass size={24} className="text-emerald-500" />
                };
            case 'COMPLETED':
                return {
                    title: 'Phase 4: Completed',
                    badge: 'Selection Concluded',
                    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
                    border: 'border-t-slate-500',
                    desc: 'The guide selection process has successfully concluded. Your team and assigned guide information is locked. Check your team page to view details.',
                    btnText: 'View Finalized Team',
                    btnPath: '/guide/team/my',
                    icon: <CheckCircle size={24} className="text-slate-500" />
                };
            default:
                return {
                    title: 'Guide Selection Portal',
                    badge: 'Portal Active',
                    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
                    border: 'border-t-primary',
                    desc: 'Welcome to the Guide Selection Portal. Here you can form teams, invite members, and select a project guide.',
                    btnText: 'Manage Team',
                    btnPath: '/guide/team/my',
                    icon: <CheckCircle size={24} className="text-primary" />
                };
        }
    };


    const formatDeadlineDate = (dateString) => {
        return new Date(dateString).toLocaleString('default', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const activePhaseMilestone = allMilestones.find(m => m.relatedPhase === phase && m.status !== 'COMPLETED');

    const getMonthAndDay = (dateString) => {
        const d = new Date(dateString);
        return {
            month: d.toLocaleString('default', { month: 'short' }),
            day: d.getDate()
        };
    };

    return (
        <>
            <div className="mb-8">
                <Badge text="Class of 2026" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Student Dashboard</h1>
                <p className="text-slate-600 mt-2 text-lg">Welcome back. Here is your academic research and collaboration overview.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN - IMPORTANT STUFF (65%) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                    
                    {/* HIGHLIGHTED ACTIVE REVIEW PHASE */}
                    {(() => {
                        const activeReview = systemConfig?.reviewSchedules?.find(r => r.isActive);
                        if (activeReview && systemConfig?.activeReviewPhase !== 'CLOSED') {
                            const reviewRecord = team?.reviews?.find(r => r.reviewName === activeReview.reviewName);
                            const isApproved = reviewRecord?.isApproved;
                            const percentage = ((reviewRecord?.checkedItems?.length || 0) / (activeReview.checklist?.length || 1)) * 100;
                            
                            return (
                                <Card className="border-l-4 border-l-primary shadow-md bg-gradient-to-r from-primary/10 to-transparent relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-primary/5 pointer-events-none"></div>
                                    
                                    <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
                                        <div>
                                            <p className="text-[11px] uppercase font-bold tracking-widest text-primary mb-1">Current Active Phase</p>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <CheckCircle className="w-6 h-6 text-primary" />
                                                {activeReview.title}
                                            </h2>
                                        </div>
                                        <span className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider border shadow-sm ${isApproved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                                            {isApproved ? 'Approved by Guide' : 'Pending Guide Approval'}
                                        </span>
                                    </div>
                                    
                                    <div className="relative z-10 mt-2 bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-bold text-slate-700">Checklist Completion Status</span>
                                            <span className={`text-xl font-black leading-none ${
                                                percentage < 40 ? 'text-red-600' :
                                                percentage < 80 ? 'text-orange-500' :
                                                'text-green-500'
                                            }`}>{Math.round(percentage)}%</span>
                                        </div>
                                        <div className="relative w-full h-3 mt-1">
                                            <div className="w-full bg-slate-200/50 rounded-full h-full overflow-hidden shadow-inner border border-slate-200/50 absolute top-0 left-0">
                                                <div 
                                                    className={`h-full transition-all duration-500 ease-out ${
                                                        percentage < 40 ? 'bg-red-500' :
                                                        percentage < 80 ? 'bg-orange-400' :
                                                        'bg-green-500'
                                                    }`} 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            {/* Milestone Markers */}
                                            {activeReview.checklist?.map((itemText, i) => {
                                                const totalItems = activeReview.checklist.length || 1;
                                                const pointPercent = ((i + 1) / totalItems) * 100;
                                                const isCompleted = percentage >= pointPercent;
                                                
                                                return (
                                                    <div 
                                                        key={i}
                                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group cursor-pointer flex justify-center"
                                                        style={{ left: `${pointPercent}%` }}
                                                    >
                                                        {/* The Dot */}
                                                        <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[2.5px] transition-all duration-300 shadow-sm ${
                                                            isCompleted ? 'bg-white border-white scale-110' : 'bg-slate-200 border-white hover:bg-slate-300'
                                                        }`}></div>
                                                        
                                                        {/* Tooltip */}
                                                        <div className={`absolute bottom-full mb-2 w-max max-w-[200px] sm:max-w-[250px] bg-slate-800 text-white text-[11px] sm:text-xs rounded-lg px-3 py-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 group-hover:scale-100 scale-95 ${
                                                            i === totalItems - 1 ? 'right-0 origin-bottom-right' : 'left-1/2 -translate-x-1/2 origin-bottom'
                                                        }`}>
                                                            <div className="font-bold text-slate-300 mb-0.5 text-[10px] uppercase tracking-wider">Milestone {i + 1} • {Math.round(pointPercent)}%</div>
                                                            <div className="leading-tight line-clamp-2">{itemText}</div>
                                                            {/* Arrow */}
                                                            <div className={`absolute top-full border-[5px] border-transparent border-t-slate-800 ${
                                                                i === totalItems - 1 ? 'right-1.5' : 'left-1/2 -translate-x-1/2'
                                                            }`}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            );
                        }
                        return null;
                    })()}

                    {/* TEAM SNAPSHOT */}
                    {!loading && team && (
                        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden p-0 rounded-2xl">
                            <div className="bg-gradient-to-r from-primary to-primary-dark p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between sm:items-end gap-6 relative overflow-hidden">
                                {/* Decorative background shapes */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay pointer-events-none"></div>
                                
                                <div className="relative z-10 max-w-2xl flex-1">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-sm border border-white/20">
                                        {team.domain || 'Domain Not Selected'}
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold font-heading leading-tight mb-3">
                                        {team.name}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="flex -space-x-2">
                                            {team.members?.map((m, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center text-xs font-bold border border-slate-200 shadow-sm z-10 relative">
                                                    {m.user.fullName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-white/90 bg-black/20 px-3 py-1 rounded-full">{team.members?.length} Members</span>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                                    <Link to={`/team/${team.id}`} className="block w-full">
                                        <Button variant="secondary" className="w-full shadow-md whitespace-nowrap">
                                            Open Team Details
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="bg-white">
                                {/* Bottom: Assigned Guide */}
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-start gap-5">
                                        {team.guide ? (
                                            <>
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Compass size={28} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-1">Assigned Guide</p>
                                                    <p className="text-lg font-bold text-slate-800">{team.guide.fullName}</p>
                                                    <p className="text-sm font-medium text-slate-500 mt-1">Project Guide</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-500 flex items-center justify-center shrink-0 shadow-sm">
                                                    <AlertTriangle size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-1">Assigned Guide</p>
                                                    <p className="text-lg font-bold text-yellow-700">Not Assigned Yet</p>
                                                    <p className="text-sm font-medium text-slate-500 mt-1">Action required in later phases</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Guide Selection Info - Dynamic phase from admin */}
                    {loading ? (
                        <Card className="border-t-4 border-t-slate-200 shadow-md h-full min-h-[200px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">Loading phase info...</span>
                            </div>
                        </Card>
                    ) : (() => {
                        const phaseInfo = getPhaseInfo(phase);
                        return (
                            <Card className={`border-t-4 ${phaseInfo.border} shadow-md hover:shadow-lg transition-all duration-300`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3">
                                        {phaseInfo.icon} {phaseInfo.title}
                                    </h2>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${phaseInfo.badgeBg} animate-pulse`}>
                                        {phaseInfo.badge}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                        {phaseInfo.desc}
                                    </p>
                                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                                        {activePhaseMilestone ? (
                                            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200/50 px-3 py-2 rounded-lg inline-flex self-start sm:self-auto">
                                                <Clock size={14} className="animate-pulse" />
                                                <span>Deadline: {formatDeadlineDate(activePhaseMilestone.dueDate)}</span>
                                            </div>
                                        ) : (
                                            <div />
                                        )}
                                        <Link to={phaseInfo.btnPath} className="w-full sm:w-auto">
                                            <Button className="flex items-center gap-2 hover:translate-x-0.5 transition-transform w-full sm:w-auto justify-center">
                                                {phaseInfo.btnText} <ArrowRight size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        );
                    })()}
                </div>

                {/* RIGHT COLUMN - INSTRUCTIONS & DEADLINES (35%) */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
                    
                    {/* Professional Instructions Card */}
                    {!loading && instructions.length > 0 && (
                        <Card className="border border-slate-200 shadow-sm bg-white">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Info size={20} className="text-slate-600" />
                                    Instructions
                                </h2>
                            </div>
                            
                            <div className="space-y-4">
                                {[...instructions].sort((a, b) => (b.order || 0) - (a.order || 0)).map((inst, idx) => {
                                    const instObj = typeof inst === 'string' ? { title: '', description: inst, type: 'INFO', targetDate: null } : inst;
                                    
                                    let indicatorColor = "bg-primary";
                                    let titleColor = "text-primary";
                                    let icon = <Info size={16} className="text-primary mt-1 shrink-0" />;
                                    
                                    if (instObj.type === 'WARNING') {
                                        indicatorColor = "bg-secondary";
                                        icon = <AlertTriangle size={16} className="text-yellow-600 mt-1 shrink-0" />;
                                    } else if (instObj.type === 'MANDATORY_ACTION') {
                                        indicatorColor = "bg-primary-dark";
                                        icon = <AlertTriangle size={16} className="text-primary-dark mt-1 shrink-0" />;
                                    }

                                    return (
                                        <div key={idx} className="relative flex flex-col sm:flex-row gap-3 p-4 sm:p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm overflow-hidden">
                                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${indicatorColor}`} />
                                            
                                            <div className="hidden sm:block pt-0.5 shrink-0 pl-1">
                                                {icon}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 pl-1 sm:pl-0">
                                                <div className="flex flex-col gap-2 mb-2">
                                                    <div className="flex items-start gap-2">
                                                        <div className="sm:hidden pt-0.5 shrink-0">{icon}</div>
                                                        <h4 className={`font-bold text-[15px] sm:text-[16px] leading-snug ${titleColor} break-words`}>
                                                            {instObj.title || 'Instruction Step'}
                                                        </h4>
                                                    </div>
                                                    
                                                    {instObj.targetDate && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 whitespace-nowrap self-start">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {formatDeadlineDate(instObj.targetDate)}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="text-[13px] sm:text-[14px] text-slate-600 space-y-2 break-words">
                                                    {instObj.description.split('\n').map((line, i) => {
                                                        const trimmedLine = line.trim();
                                                        if (!trimmedLine) return null;
                                                        
                                                        const listMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
                                                        if (listMatch) {
                                                            return (
                                                                <div key={i} className="flex items-start gap-2">
                                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold shrink-0 mt-0.5">
                                                                        {listMatch[1]}
                                                                    </span>
                                                                    <span className="flex-1 min-w-0 mt-0.5">{listMatch[2]}</span>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        const bulletMatch = trimmedLine.match(/^[-•]\s+(.*)/);
                                                        if (bulletMatch) {
                                                            return (
                                                                <div key={i} className="flex items-start gap-2">
                                                                    <span className="flex items-center justify-center w-5 h-5 shrink-0 mt-0.5 text-slate-400">
                                                                        <ChevronRight size={14} />
                                                                    </span>
                                                                    <span className="flex-1 min-w-0 mt-0.5">{bulletMatch[1]}</span>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return <p key={i}>{trimmedLine}</p>;
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Upcoming Deadlines */}
                    {loading ? (
                        <Card className="border-t-4 border-t-slate-200 shadow-md h-full min-h-[200px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">Loading deadlines...</span>
                            </div>
                        </Card>
                    ) : (
                        <Card className="border-t-4 border-t-red-500 shadow-md hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                                <Clock size={20} className="text-red-500" /> Upcoming Deadlines
                            </h2>
                            <div className="space-y-3">
                                {deadlines.length === 0 ? (
                                    <div className="text-center py-6 text-slate-500 text-sm">No upcoming deadlines configured.</div>
                                ) : (
                                    deadlines.map((deadline) => {
                                        const { month, day } = getMonthAndDay(deadline.dueDate);
                                        return (
                                            <div key={deadline.id} className="flex gap-3 p-3 border border-red-100 bg-red-50 rounded-xl hover:shadow-sm transition-shadow">
                                                <div className="bg-white p-2 rounded-xl shadow-sm border border-red-100 text-center min-w-[60px] flex flex-col justify-center">
                                                    <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest">{month}</span>
                                                    <span className="block text-xl font-black text-slate-900 leading-none mt-1">{day}</span>
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <h4 className="font-bold text-slate-900 text-[15px]">{deadline.title}</h4>
                                                    <p className="text-xs text-slate-600 mt-0.5 font-medium line-clamp-2">{deadline.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;
