import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import { Users, UserPlus, Shield, User } from 'lucide-react';
import Button from '../../components/common/Button';

const TeamFormation = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch('http://localhost:5000/api/teams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const handleJoinTeam = async (teamId) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`http://localhost:5000/api/teams/${teamId}/join`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ role: 'Member' })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Successfully joined the team!');
                window.location.reload();
            } else {
                alert(data.message || 'Failed to join team');
            }
        } catch (error) {
            alert('Error joining team');
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-primary/10 pb-6 gap-4">
                <div>
                    <Badge text="Collaboration" />
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Team Formation</h1>
                    <p className="text-slate-600 mt-2 text-lg">Find peers with complementary skills and build your dream team.</p>
                </div>
                <Button variant="gradient" className="gap-2 shadow-md">
                    <UserPlus size={18} /> Create New Team
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading teams...</div>
            ) : teams.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center">
                    <Users size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No Teams Found</h3>
                    <p className="text-slate-500 mt-2">Be the first to create a team for an upcoming project.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <Card key={team.id} className="flex flex-col h-full hover:shadow-xl transition-shadow border-t-4 border-t-secondary relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <Users size={64} />
                            </div>
                            <div className="mb-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200 mb-3">
                                    {team.status}
                                </span>
                                <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">{team.name}</h3>
                                <p className="text-slate-600 text-sm line-clamp-2">{team.description}</p>
                                {team.project && <p className="mt-3 text-xs font-semibold text-primary px-2 py-1 bg-primary/5 rounded border border-primary/10 inline-block">Project: {team.project.title}</p>}
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100 flex-grow flex flex-col justify-end">
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Members ({team.members?.length || 0})</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-secondary" />
                                            <span className="text-sm font-bold text-slate-700">{team.leader?.user?.fullName} (Leader)</span>
                                        </div>
                                        {team.members?.filter(m => m.studentId !== team.leaderId).slice(0, 3).map(m => (
                                            <div key={m.id} className="flex items-center gap-2 pl-5">
                                                <User size={12} className="text-slate-400" />
                                                <span className="text-sm text-slate-600">{m.student?.user?.fullName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full mt-2" variant="outline" onClick={() => handleJoinTeam(team.id)}>
                                    Join Team
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeamFormation;
