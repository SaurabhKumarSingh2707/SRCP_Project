import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Flag, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

const Milestones = ({ projectId }) => {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('sarc_role');

    useEffect(() => {
        // Since this page might be accessed standalone via sidebar without a specific project selected,
        // in a real app we'd fetch all milestones for all projects the user is involved in.
        // For demonstration, we'll fetch dummy data if projectId isn't provided.
        const fetchMilestones = async () => {
            try {
                if (!projectId) {
                    // Provide some gorgeous mock data for demonstration when accessed from sidebar
                    setMilestones([
                        { id: 1, title: 'Project Proposal Submission', description: 'Submit detailed lit review and methodology.', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'PENDING', project: { title: 'AI Cancer Detection' } },
                        { id: 2, title: 'Mid-term Prototype Review', description: 'Working MVP demo to faculty.', dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), status: 'PENDING', project: { title: 'AI Cancer Detection' } },
                        { id: 3, title: 'Initial Setup', description: 'Repo setup and environment config.', dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'COMPLETED', project: { title: 'AI Cancer Detection' } },
                    ]);
                    setLoading(false);
                    return;
                }

                const token = localStorage.getItem('sarc_token');
                const res = await fetch(`http://localhost:5000/api/milestones/project/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMilestones(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMilestones();
    }, [projectId]);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8 border-b border-primary/10 pb-6">
                <div>
                    <Badge text="Project Tracking" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Milestones & Deadlines</h1>
                    <p className="text-slate-600 mt-2 text-lg">Track your upcoming deliverables and project timelines.</p>
                </div>
                {role === 'FACULTY' && (
                    <Button variant="gradient" className="shadow-md gap-2"><Flag size={18} /> Create Milestone</Button>
                )}
            </div>

            {loading ? (
                 <div className="text-center py-10">Loading timeline...</div>
            ) : milestones.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center">
                    <Flag size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No Milestones</h3>
                    <p className="text-slate-500 mt-2">No active milestones or deadlines tracked right now.</p>
                </Card>
            ) : (
                <div className="relative pt-4">
                    {/* Timeline Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 transform -translate-x-1/2 rounded-full hidden md:block"></div>
                    
                    <div className="space-y-8">
                        {milestones.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).map((m, index) => {
                            const isPast = new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED';
                            const isCompleted = m.status === 'COMPLETED';
                            
                            return (
                            <div key={m.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                                {/* Timeline Dot */}
                                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-white shadow-sm transform -translate-x-1/2 flex items-center justify-center z-10 hidden md:flex
                                    ${isCompleted ? 'bg-green-500' : isPast ? 'bg-red-500' : 'bg-secondary'}">
                                    {isCompleted ? <CheckCircle size={14} className="text-white"/> : isPast ? <AlertCircle size={14} className="text-white" /> : <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                </div>
                                
                                <Card className={`w-full md:w-[calc(50%-2rem)] relative shadow-md hover:shadow-xl transition-all border-t-4 
                                    ${isCompleted ? 'border-t-green-500 bg-green-50/50' : isPast ? 'border-t-red-500 bg-red-50/50' : 'border-t-secondary'} 
                                    group-hover:-translate-y-1`}>
                                    
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge color={isCompleted ? 'green' : isPast ? 'red' : 'yellow'}>{m.status}</Badge>
                                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${isPast && !isCompleted ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <Calendar size={14} />
                                            {new Date(m.dueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-800 font-heading mb-2">{m.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4">{m.description}</p>
                                    
                                    {m.project && <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3">{m.project.title}</p>}
                                    
                                    {!isCompleted && role === 'STUDENT' && (
                                        <Button className="w-full mt-4 bg-white shadow-sm hover:shadow" variant="outline" size="sm">
                                            Submit Deliverable
                                        </Button>
                                    )}
                                </Card>
                            </div>
                        )})}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Milestones;
