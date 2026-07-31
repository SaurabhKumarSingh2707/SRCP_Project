import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TeamCard from '../../components/guide/TeamCard';
import Button from '../../components/common/Button';

const GuideTeamMy = () => {
    const queryClient = useQueryClient();
    
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        projectTitle: '', description: '', domain: '', customDomain: ''
    });
    const [editLoading, setEditLoading] = useState(false);

    // We now rely on team.currentUserId provided by the backend to avoid JWT decoding issues


    const { data: team, isLoading: teamLoading } = useQuery({
        queryKey: ['myTeam'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchInterval: 30000 // Auto-poll every 30 seconds to keep team state synced
    });

    const { data: phaseData, isLoading: phaseLoading } = useQuery({
        queryKey: ['guidePhase'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return { phase: 'CLOSED' };
            return res.json();
        },
        staleTime: 5 * 60 * 1000
    });

    const { data: systemConfig, isLoading: configLoading } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 5 * 60 * 1000
    });

    const phase = phaseData?.phase || 'CLOSED';
    const loading = teamLoading || phaseLoading || configLoading;

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        const wordCount = editData.description.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 100) {
            alert('Project description cannot exceed 100 words.');
            return;
        }

        setEditLoading(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const submitData = {
                projectTitle: editData.projectTitle,
                description: editData.description,
                domain: editData.domain === 'Other' ? editData.customDomain : editData.domain
            };
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update team');
            }
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
        } catch (error) {
            alert(error.message);
        } finally {
            setEditLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamId: team.id,
                    registerNumberOrEmail: inviteEmail
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send invite');
            
            setMessage(data.message);
            setInviteEmail('');
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        console.log("[FRONTEND] handleDeleteTeam triggered");
        if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
        
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete team');
            }
            alert('Team deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCancelInvite = async (inviteeId) => {
        console.log(`[FRONTEND] handleCancelInvite triggered for inviteeId: ${inviteeId}`);
        if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
        
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invite/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    teamId: team.id,
                    inviteeId
                })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to cancel invitation');
            }
            alert('Invitation cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
        } catch (error) {
            alert(error.message);
        }
    };

    const activeMembersCount = team?.members?.filter(m => m.inviteStatus === 'PENDING' || m.inviteStatus === 'ACCEPTED')?.length || 0;
    const canInvite = activeMembersCount < 2 && team?.status === 'FORMING'; // Max 2 members
    const isLeader = team && team.currentUserId ? team.leaderId === team.currentUserId : false;
    const canEdit = isLeader;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-text-primary">My Team</h1>
                {team && canEdit && !isEditing && (
                    <div className="flex gap-2 items-center">
                        {systemConfig?.isTeamEditingEnabled !== false ? (
                            <Button onClick={() => {
                                const isCustomDomain = team.domain && !['AI/ML', 'Web Development', 'Mobile Development', 'Cybersecurity', 'IoT', 'Blockchain'].includes(team.domain);
                                setEditData({
                                    projectTitle: team.name,
                                    description: team.description,
                                    domain: isCustomDomain ? 'Other' : team.domain,
                                    customDomain: isCustomDomain ? team.domain : ''
                                });
                                setIsEditing(true);
                            }} variant="outline">
                                Edit Team
                            </Button>
                        ) : (
                            <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                                Editing Disabled
                            </span>
                        )}
                        {team.status === 'FORMING' && (
                            <Button onClick={handleDeleteTeam} variant="outline" className="!text-red-500 !border-red-500 hover:!bg-red-500/10">
                                Delete Team
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {loading || !systemConfig ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-2xl border border-border shadow-sm mt-8">
                    <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary font-medium animate-pulse">Loading team details...</p>
                </div>
            ) : !team ? (
                <div className="bg-surface/50 p-12 rounded-2xl border border-border text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">No Team Found</h2>
                    {phase === 'CLOSED' && systemConfig.isTeamCreationEnabled ? (
                        <>
                            <p className="text-text-secondary mb-6">You are not part of any guide selection team yet.</p>
                            <Button onClick={() => window.location.href='/guide/team/create'}>Create a Team</Button>
                        </>
                    ) : (
                        <p className="text-text-secondary mb-6 text-yellow-600 bg-yellow-50 p-4 rounded-xl inline-block border border-yellow-200">
                            {phase === 'CLOSED' 
                                ? "The team creation phase is currently disabled by administrators." 
                                : phase === 'FACULTY_SELECTION'
                                ? "Team creation is over. The Faculty Selection phase is currently active."
                                : phase === 'STUDENT_SELECTION'
                                ? "Team creation is over. The Student Selection phase is currently active."
                                : "Team creation is over. All guide selection phases are complete."}
                        </p>
                    )}
                </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {isEditing ? (
                        <div className="bg-surface/50 border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-text-primary">Edit Team Details</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Project Title</label>
                                    <input type="text" value={editData.projectTitle} onChange={e => setEditData({...editData, projectTitle: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" placeholder="e.g., Smart Attendance System" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Project Description</label>
                                    <textarea 
                                        value={editData.description} 
                                        onChange={e => setEditData({...editData, description: e.target.value})} 
                                        className={`w-full bg-canvas border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[120px] ${
                                            editData.description.trim().split(/\s+/).filter(Boolean).length > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border'
                                        }`} 
                                        placeholder="Briefly describe what your project does..." 
                                        required 
                                    />
                                    {(() => {
                                        const wordCount = editData.description.trim().split(/\s+/).filter(Boolean).length;
                                        return (
                                            <p className={`text-xs mt-1 text-right ${wordCount > 100 ? 'text-red-500 font-semibold' : 'text-text-secondary'}`}>
                                                {wordCount} / 100 words
                                            </p>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Domain</label>
                                    <select value={editData.domain} onChange={e => setEditData({...editData, domain: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" required>
                                        <option value="AI/ML">AI / Machine Learning</option>
                                        <option value="Web Development">Web Development</option>
                                        <option value="Mobile Development">Mobile App Development</option>
                                        <option value="Cybersecurity">Cybersecurity</option>
                                        <option value="IoT">Internet of Things (IoT)</option>
                                        <option value="Blockchain">Blockchain</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {editData.domain === 'Other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">Custom Domain Name</label>
                                        <input type="text" value={editData.customDomain} onChange={e => setEditData({...editData, customDomain: e.target.value})} className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" placeholder="Enter your domain name" required />
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <TeamCard team={team} showStatus={true} onCancelInvite={isLeader ? handleCancelInvite : null} />
                    )}
                </div>
                
                <div>
                    <div className="bg-surface/50 border border-border rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Invite Member</h3>
                        
                        {!canInvite ? (
                            <p className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                                {team.status !== 'FORMING' ? 'Team is finalized. No more invites can be sent.' : 'Your team is full (max 2 members including pending invites).'}
                            </p>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <p className="text-sm text-text-secondary mb-2">Invite your partner using their email or register number.</p>
                                <input 
                                    type="text" 
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Email or Register Number"
                                    className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                                    required
                                />
                                <Button type="submit" className="w-full" disabled={inviteLoading}>
                                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                                </Button>
                            </form>
                        )}
                        
                        {message && (
                            <div className="mt-4 text-sm p-3 rounded-xl bg-accent/10 text-accent border border-accent/20">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default GuideTeamMy;
