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

            const [resDeadlines, resPhase, resSystem] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/global-milestones`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, { headers })
            ]);

            let allMilestones = [];
            let upcomingDeadlines = [];
            let phase = 'CLOSED';
            let instructions = [];

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
                const sData = await resSystem.json();
                instructions = sData.phaseOneInstructions || [];
            }

            return { allMilestones, deadlines: upcomingDeadlines, phase, instructions };
        },
        staleTime: 5 * 60 * 1000
    });

    const { deadlines = [], allMilestones = [], phase = 'CLOSED', instructions = [] } = dashboardData || {};

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

            {/* Professional Instructions Card */}
            {!loading && instructions.length > 0 && (
                <div className="mb-8">
                    <Card className="border border-slate-200 shadow-sm bg-white">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Info size={20} className="text-slate-600" />
                                Action Plan & Announcements
                            </h2>
                        </div>
                        
                        <div className="space-y-6">
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
                                    <div key={idx} className="relative flex flex-col sm:flex-row gap-3 sm:gap-5 p-5 sm:p-6 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                        {/* Indicator: Top bar on mobile, Left bar on desktop */}
                                        <div className={`absolute top-0 left-0 right-0 sm:right-auto sm:bottom-0 h-1 sm:h-full sm:w-1.5 ${indicatorColor}`} />
                                        
                                        <div className="hidden sm:block pt-1 shrink-0">
                                            {icon}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-3 sm:mb-4">
                                                <div className="flex items-start gap-2">
                                                    <div className="sm:hidden pt-0.5 shrink-0">{icon}</div>
                                                    <h4 className={`font-bold text-[17px] sm:text-[19px] leading-snug ${titleColor} break-words`}>
                                                        {instObj.title || 'Instruction Step'}
                                                    </h4>
                                                </div>
                                                
                                                {instObj.targetDate && (
                                                    <span className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap self-start lg:shrink-0">
                                                        <Clock size={14} className="text-slate-400" />
                                                        Deadline: {formatDeadlineDate(instObj.targetDate)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="text-[14.5px] sm:text-[15px] text-slate-600 space-y-3 break-words">
                                                {instObj.description.split('\n').map((line, i) => {
                                                    const trimmedLine = line.trim();
                                                    if (!trimmedLine) return null;
                                                    
                                                    const listMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
                                                    if (listMatch) {
                                                        return (
                                                            <div key={i} className="flex items-start gap-3 group/item">
                                                                <span className="flex items-center justify-center w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-bold shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                                                    {listMatch[1]}
                                                                </span>
                                                                <span className="flex-1 min-w-0 mt-0.5 sm:mt-1">{listMatch[2]}</span>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    const bulletMatch = trimmedLine.match(/^[-•]\s+(.*)/);
                                                    if (bulletMatch) {
                                                        return (
                                                            <div key={i} className="flex items-start gap-3 group/item">
                                                                <span className="flex items-center justify-center w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full bg-slate-100 text-slate-400 shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                                                    <ChevronRight size={14} className="sm:w-[16px] sm:h-[16px]" />
                                                                </span>
                                                                <span className="flex-1 min-w-0 mt-0.5 sm:mt-1">{bulletMatch[1]}</span>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return <p key={i} className="pl-0 sm:pl-[38px]">{trimmedLine}</p>;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                            <Clock size={24} className="text-red-500" /> Upcoming Deadlines
                        </h2>
                        <div className="space-y-4">
                            {deadlines.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-sm">No upcoming deadlines configured by the administration.</div>
                            ) : (
                                deadlines.map((deadline) => {
                                    const { month, day } = getMonthAndDay(deadline.dueDate);
                                    return (
                                        <div key={deadline.id} className="flex gap-4 p-4 border border-red-100 bg-red-50 rounded-xl hover:shadow-sm transition-shadow">
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-red-100 text-center min-w-[70px] flex flex-col justify-center">
                                                <span className="block text-xs font-bold text-red-500 uppercase tracking-widest">{month}</span>
                                                <span className="block text-2xl font-black text-slate-900">{day}</span>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <h4 className="font-bold text-slate-900 text-lg">{deadline.title}</h4>
                                                <p className="text-sm text-slate-600 mt-1 font-medium">{deadline.description}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
};

export default StudentDashboard;
