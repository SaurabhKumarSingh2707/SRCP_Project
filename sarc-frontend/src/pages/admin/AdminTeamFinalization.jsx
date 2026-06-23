import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Trash2, Download } from 'lucide-react';

const AdminTeamFinalization = () => {
    const queryClient = useQueryClient();
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const { data: teams = [], isLoading: loading } = useQuery({
        queryKey: ['adminTeams'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch teams');
            return res.json();
        },
        staleTime: 5 * 60 * 1000
    });

    useEffect(() => {
        if (!searchTerm) {
            setFilteredTeams(teams);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredTeams(teams.filter(t => 
                t.name.toLowerCase().includes(lower) || 
                t.id.toLowerCase().includes(lower) || 
                t.domain.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, teams]);

    const handleToggleFinalize = async (teamId, currentStatus) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams/${teamId}/finalize`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isFinalized: !currentStatus })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            queryClient.invalidateQueries(['adminTeams']);
            setMessage({ text: `Team ${currentStatus ? 'unfinalized' : 'finalized'} successfully`, type: 'success' });
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleFinalizeAll = async () => {
        if (!window.confirm('Are you sure you want to finalize all teams that have the required number of accepted members (1-2)?')) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams/finalize-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            const data = await res.json();
            queryClient.invalidateQueries(['adminTeams']);
            setMessage({ text: data.message, type: 'success' });
            
            setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you ABSOLUTELY sure you want to delete this team? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            queryClient.invalidateQueries(['adminTeams']);
            setMessage({ text: 'Team deleted successfully', type: 'success' });
            
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const headers = ['Team ID', 'Team Name', 'Project Title', 'Domain', 'Finalized', 'Leader Name', 'Leader Email', 'Leader Reg No', 'Member Name', 'Member Email', 'Member Reg No', 'Member Status'];
        
        const rows = filteredTeams.map(team => {
            const leader = team.leader;
            const activeMembers = team.members.filter(m => !m.isLeader && m.inviteStatus !== 'REJECTED');
            const member = activeMembers.length > 0 ? activeMembers[0] : null;

            return [
                team.id || '',
                `"${(team.name || '').replace(/"/g, '""')}"`,
                `"${(team.description || '').replace(/"/g, '""')}"`,
                team.domain || '',
                team.status !== 'FORMING' ? 'Yes' : 'No',
                `"${(leader?.fullName || '').replace(/"/g, '""')}"`,
                leader?.email || '',
                leader?.registerNumber || '',
                `"${(member?.user?.fullName || '').replace(/"/g, '""')}"`,
                member?.user?.email || '',
                member?.user?.registerNumber || '',
                member?.inviteStatus || ''
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Team_Finalization_Export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Team Finalization</h1>
                    <p className="text-text-secondary">Review and manually finalize student teams before the Guide Selection phase.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleFinalizeAll}
                        className="w-full md:w-auto px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl font-bold transition-colors whitespace-nowrap"
                    >
                        Finalize All Ready
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="w-full md:w-auto px-4 py-2 border border-border hover:bg-surface text-text-primary rounded-xl font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <div className="relative w-full md:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Search teams..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent text-sm"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-2xl border border-border shadow-sm mt-8">
                    <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary font-medium animate-pulse">Loading teams...</p>
                </div>
            ) : (
                <>
                    {message.text && (
                        <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-green-500/10 border border-green-500/20 text-green-500'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface border-b border-border">
                                        <th className="p-4 text-sm font-medium text-text-secondary">Team Details</th>
                                        <th className="p-4 text-sm font-medium text-text-secondary">Members</th>
                                        <th className="p-4 text-sm font-medium text-text-secondary">Readiness</th>
                                        <th className="p-4 text-sm font-medium text-text-secondary text-right">Finalize Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeams.map(team => {
                                        const activeMembers = team.members.filter(m => m.inviteStatus !== 'REJECTED');
                                        const totalMembers = activeMembers.length;
                                        const acceptedCount = activeMembers.filter(m => m.inviteStatus === 'ACCEPTED').length;
                                        const isReady = acceptedCount >= 1 && acceptedCount <= 2;

                                        return (
                                            <tr key={team.id} className={`border-b border-border/50 hover:bg-surface/80 transition-colors ${team.status !== 'FORMING' ? 'bg-green-500/5' : ''}`}>
                                                <td className="p-4">
                                                    <p className="font-bold text-text-primary">{team.name}</p>
                                                    <p className="text-xs text-text-secondary mb-1">{team.teamCode || team.id}</p>
                                                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                                                        {team.domain}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="mb-1">
                                                        <span className="font-medium text-text-primary">Leader:</span> {team.leader.fullName}
                                                    </div>
                                                    {activeMembers.filter(m => !m.isLeader).map(m => (
                                                        <div key={m.id} className="text-text-secondary text-xs">
                                                            • {m.user?.fullName} ({m.inviteStatus})
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        isReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'
                                                    }`}>
                                                        {acceptedCount} / {totalMembers} Accepted
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleToggleFinalize(team.id, team.status !== 'FORMING')}
                                                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                                                team.status !== 'FORMING' 
                                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                                                : 'bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent'
                                                            }`}
                                                        >
                                                            {team.status !== 'FORMING' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                            {team.status !== 'FORMING' ? 'Finalized' : 'Mark Finalized'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTeam(team.id)}
                                                            title="Delete Team"
                                                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTeams.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-text-secondary">No teams found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminTeamFinalization;
