import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FacultyGuideCard from '../../components/guide/FacultyGuideCard';
import { Search } from 'lucide-react';

const GuideSelect = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');

    const token = localStorage.getItem('sarc_token');
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const { data: team, isLoading: isTeamLoading, error: teamError } = useQuery({
        queryKey: ['myTeam'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch team data');
            return data;
        }
    });

    const { data: phaseData, isLoading: isPhaseLoading } = useQuery({
        queryKey: ['guidePhase'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch phase data');
            return data;
        }
    });

    const isSelectionActive = phaseData?.phase === 'STUDENT_SELECTION';

    const { data: facultyList = [], isLoading: isFacultyLoading, error: facultyError } = useQuery({
        queryKey: ['availableFaculty'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/available`, { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch faculty data');
            return data;
        },
        enabled: isSelectionActive
    });

    const loading = isTeamLoading || isPhaseLoading || (isSelectionActive && isFacultyLoading);

    // Capture errors
    const errorMsg = (teamError && teamError.message) || (facultyError && facultyError.message);

    const handleSelectGuide = async (faculty) => {
        if (!window.confirm(`Are you sure you want to select Prof. ${faculty.name} as your guide? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/${team.id}/select-guide`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ facultyId: faculty.facultyId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
        } catch (error) {
            setMessage(error.message);
        } finally {
            // Invalidate queries to trigger a refetch of the latest data
            queryClient.invalidateQueries({ queryKey: ['myTeam'] });
            queryClient.invalidateQueries({ queryKey: ['availableFaculty'] });
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    if (errorMsg) return <div className="p-8 text-center text-red-500">{errorMsg}</div>;

    if (!team || team.status === 'FORMING') {
        return <div className="p-8 text-center text-red-500">Your team is not finalized yet.</div>;
    }

    if (!isSelectionActive) {
        return (
            <div className="max-w-6xl mx-auto py-8 px-4 text-center">
                 <h1 className="text-3xl font-bold text-text-primary mb-2">Guide Selection is Currently Closed</h1>
                 <p className="text-text-secondary">The administrator has not opened the guide selection phase yet. Please check back later when the phase is active.</p>
            </div>
        );
    }

    const hasRequestedGuide = team.status === 'REQUESTED_GUIDE' && team.guideId != null;
    const isGuideAllocated = team.status === 'APPROVED';
    const hasGuide = hasRequestedGuide || isGuideAllocated;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Select Your Guide</h1>
            <p className="text-text-secondary mb-8">Browse available faculty members and select a guide for your project.</p>

            {message && (
                <div className={`p-4 rounded-xl mb-6 border ${message.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {message}
                </div>
            )}

            {!hasGuide && facultyList.length > 0 && (
                <div className="mb-6 relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                    />
                </div>
            )}

            {hasGuide ? (
                <div className="bg-surface/50 border border-border p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-green-500 mb-2">
                        {isGuideAllocated ? 'Guide Allocated ✅' : 'Guide Requested ⏳'}
                    </h2>
                    <p className="text-text-secondary">
                        {isGuideAllocated 
                            ? 'Your team has been successfully allocated a guide. Check your dashboard for details.'
                            : 'You have requested a guide. Please wait for the faculty to accept your request.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {facultyList.filter(f => 
                        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (f.department && f.department.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map(faculty => (
                        <FacultyGuideCard
                            key={faculty.facultyId}
                            faculty={faculty}
                            isSelectable={team && team.currentUserId ? team.leaderId === team.currentUserId : false} // Only leader can click
                            onSelect={handleSelectGuide}
                            isSelected={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuideSelect;
