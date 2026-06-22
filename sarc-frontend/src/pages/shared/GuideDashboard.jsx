import React, { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';

const GuideDashboard = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                // Extract role from token to show/hide admin controls
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setRole(payload.user.role);
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Failed to fetch dashboard');
                const data = await res.json();
                setTeams(data);
                setFilteredTeams(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredTeams(teams);
            return;
        }

        const lower = searchTerm.toLowerCase();
        const filtered = teams.filter(t => 
            t.name.toLowerCase().includes(lower) ||
            t.domain.toLowerCase().includes(lower) ||
            t.guide?.fullName.toLowerCase().includes(lower)
        );
        setFilteredTeams(filtered);
    }, [searchTerm, teams]);

    const handleExport = () => {
        // Implementation for exporting to CSV
        const headers = ["Team ID", "Team Name", "Domain", "Guide", "Guide Dept", "Leader", "Members"];
        const rows = filteredTeams.map(t => [
            t.id,
            t.name,
            t.domain,
            t.guide?.fullName || 'N/A',
            t.guide?.facultyProfile?.department || 'N/A',
            `${t.leader.fullName} (${t.leader.registerNumber || ''})`,
            t.members.map(m => `${m.user.fullName} (${m.user.registerNumber || ''})`).join('; ')
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "guide_allocations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Guide Allocation Dashboard</h1>
                    <p className="text-text-secondary">View finalized teams and their assigned guides.</p>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input 
                            type="text" 
                            placeholder="Search teams, domain, guide..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent text-sm"
                        />
                    </div>
                    {role === 'ADMIN' && (
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-text-primary hover:bg-surface/80 transition-colors text-sm font-medium">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    )}
                </div>
            </div>

            {filteredTeams.length === 0 ? (
                <div className="text-center py-16 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary">No matched teams found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeams.map(team => (
                        <div key={team.id} className="bg-surface/50 border border-border rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-accent/20">
                                {team.domain}
                            </div>
                            
                            <h3 className="text-xl font-bold text-text-primary mb-1">{team.name}</h3>
                            <p className="text-xs text-text-secondary mb-4">{team.id}</p>
                            
                            <div className="mb-4">
                                <p className="text-sm font-medium text-text-primary line-clamp-1">Project Description</p>
                                <p className="text-sm text-text-secondary line-clamp-2 mt-1">{team.description}</p>
                            </div>

                            <div className="bg-canvas rounded-xl p-4 mb-4 border border-border">
                                <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Guide Assigned</p>
                                <p className="font-medium text-text-primary">{team.guide?.fullName || 'Unknown'}</p>
                                <p className="text-xs text-text-secondary">
                                    {team.guide?.facultyProfile?.designation} • {team.guide?.facultyProfile?.department}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Team Members</p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs">👑</div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{team.leader.fullName}</p>
                                            <p className="text-xs text-text-secondary">{team.leader.registerNumber}</p>
                                        </div>
                                    </li>
                                    {team.members.map(m => (
                                        <li key={m.id} className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-xs">👤</div>
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{m.user.fullName}</p>
                                                <p className="text-xs text-text-secondary">{m.user.registerNumber}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuideDashboard;
