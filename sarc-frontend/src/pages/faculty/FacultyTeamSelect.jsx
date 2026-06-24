import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import TeamCard from '../../components/guide/TeamCard';
import Button from '../../components/common/Button';

const FacultyTeamSelect = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [visibleLimit, setVisibleLimit] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [phase, setPhase] = useState('CLOSED');
    const [selectionsCount, setSelectionsCount] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const [teamRes, phaseRes, selectionsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/teams`, {
                        cache: 'no-store',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, {
                        cache: 'no-store',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Cache-Control': 'no-cache'
                        }
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/my-selections`, {
                        cache: 'no-store',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                
                if (phaseRes.ok) {
                    const pData = await phaseRes.json();
                    setPhase(pData.phase);
                }

                if (selectionsRes.ok) {
                    const sData = await selectionsRes.json();
                    setSelectionsCount(sData.length);
                }

                if (!teamRes.ok) throw new Error('Failed to fetch teams');
                const data = await teamRes.json();
                setTeams(data);
                setFilteredTeams(data);
            } catch (error) {
                console.error(error);
                setMessage('Error loading available teams.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    useEffect(() => {
        setVisibleLimit(50);
        if (!searchQuery) {
            setFilteredTeams(teams);
            return;
        }
        
        const q = searchQuery.toLowerCase();
        const filtered = teams.filter(team => {
            if (team.name?.toLowerCase().includes(q) || team.id?.toLowerCase().includes(q)) return true;
            if (team.members) {
                return team.members.some(m => {
                    const studentName = m.user?.fullName?.toLowerCase() || '';
                    const registerNo = m.user?.registerNumber?.toLowerCase() || m.user?.email?.toLowerCase() || '';
                    return studentName.includes(q) || registerNo.includes(q);
                });
            }
            return false;
        });
        setFilteredTeams(filtered);
    }, [searchQuery, teams]);

    const handleToggleSelect = (team) => {
        if (selectedTeamIds.includes(team.id)) {
            setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
        } else {
            if (selectedTeamIds.length >= 2) {
                alert('You can only select a maximum of 2 teams at once.');
                return;
            }
            setSelectedTeamIds([...selectedTeamIds, team.id]);
        }
    };

    const handleSubmitSelections = async () => {
        if (selectedTeamIds.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        setMessage('');

        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/select`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ teamIds: selectedTeamIds })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
            setSelectionsCount(prev => prev + selectedTeamIds.length);
            setSelectedTeamIds([]);
            
            // Remove selected teams from list locally to update UI immediately
            setTeams(teams.filter(t => !selectedTeamIds.includes(t.id)));
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                {phase === 'FACULTY_SELECTION' && (
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">Select Project Teams</h1>
                        <p className="text-text-secondary">Browse and select up to 2 teams to guide for their final year project.</p>
                    </div>
                )}
                
                {phase === 'FACULTY_SELECTION' && selectionsCount < 2 && (
                    <div className="bg-surface/80 p-4 rounded-xl border border-border flex items-center gap-4">
                        <span className="text-sm font-medium text-text-secondary">
                            Selected: <strong className="text-accent">{selectedTeamIds.length} / {2 - selectionsCount}</strong>
                        </span>
                        <Button 
                            onClick={handleSubmitSelections} 
                            disabled={selectedTeamIds.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Assigning...' : 'Assign Teams'}
                        </Button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.includes('successfully') ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                    {message}
                </div>
            )}

            {phase === 'FACULTY_SELECTION' && selectionsCount < 2 && (
                <div className="mb-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-text-secondary" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by team name, team ID, student name, or register number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                </div>
            )}

            {phase !== 'FACULTY_SELECTION' ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary mb-4 text-yellow-600 bg-yellow-50 p-4 rounded-xl inline-block border border-yellow-200">
                        The Faculty Selection phase is currently closed. You can no longer select teams.
                    </p>
                </div>
            ) : selectionsCount >= 2 ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary mb-4 text-green-600 bg-green-50 p-4 rounded-xl inline-block border border-green-200">
                        You have successfully selected your maximum allowed number of teams ({selectionsCount}). Your selection process is complete.
                    </p>
                </div>
            ) : filteredTeams.length === 0 ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary">No available teams to select at this moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.slice(0, visibleLimit).map(team => {
                        const isSelected = selectedTeamIds.includes(team.id);
                        return (
                            <div key={team.id} className="relative">
                                <TeamCard 
                                    team={team} 
                                    actionLabel={isSelected ? "Deselect" : "Select Team"}
                                    onAction={handleToggleSelect}
                                    showStatus={false}
                                />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-accent text-canvas w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-canvas">
                                        ✓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {filteredTeams.length > visibleLimit && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => setVisibleLimit(prev => prev + 50)}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-300 shadow-sm"
                    >
                        Load More Teams ({filteredTeams.length - visibleLimit} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};

export default FacultyTeamSelect;
