import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import InviteCard from '../../components/guide/InviteCard';

const TeamInvites = () => {
    const [teamInvites, setTeamInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const queryClient = useQueryClient();

    const fetchInvites = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invites/my`, { 
                headers,
                credentials: 'include'
            });
            
            const teamData = teamRes.ok ? await teamRes.json() : [];
            setTeamInvites(Array.isArray(teamData) ? teamData : []);
        } catch (error) {
            console.error('Error fetching team invites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const respondToTeamInvite = async (teamId, action) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invite/respond`, {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify({ teamId, action })
            });

            if (!res.ok) throw new Error((await res.json()).message);
            setMessage(`Team invitation ${action.toLowerCase()}ed.`);
            fetchInvites();
            queryClient.invalidateQueries({ queryKey: ['pendingInvites'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Team Invitations</h1>

            {message && (
                <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6">
                    {message}
                </div>
            )}

            <div className="space-y-8">
                <section>
                    {teamInvites.length === 0 ? (
                        <p className="text-text-secondary">No pending team invitations.</p>
                    ) : (
                        <div className="space-y-4">
                            {teamInvites.map(invite => (
                                <InviteCard 
                                    key={invite.id}
                                    type="team"
                                    title={invite.team.name}
                                    subtitle={invite.team.description}
                                    details={`Leader: ${invite.team.leader?.fullName} | Domain: ${invite.team.domain}`}
                                    onAccept={() => respondToTeamInvite(invite.team.id, 'ACCEPT')}
                                    onReject={() => respondToTeamInvite(invite.team.id, 'REJECT')}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default TeamInvites;
