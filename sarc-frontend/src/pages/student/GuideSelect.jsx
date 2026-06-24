import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyGuideCard from '../../components/guide/FacultyGuideCard';
import { Search } from 'lucide-react';

const GuideSelect = () => {
    const navigate = useNavigate();
    const [facultyList, setFacultyList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // We now rely on team.currentUserId provided by the backend to avoid JWT decoding issues


    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                
                const [teamRes, phaseRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/guide/phase`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const teamData = await teamRes.json();
                if (teamRes.ok) {
                    setTeam(teamData);
                } else {
                    throw new Error(teamData.message || 'Failed to fetch team data');
                }

                const phaseData = await phaseRes.json();
                if (phaseData.phase !== 'STUDENT_SELECTION') {
                    setMessage('Guide Selection is not currently active.');
                    setLoading(false);
                    return;
                }

                const facRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/available`, { headers: { 'Authorization': `Bearer ${token}` } });

                const facData = await facRes.json();
                if (facRes.ok) {
                    setFacultyList(facData);
                } else {
                    throw new Error(facData.message || 'Failed to fetch faculty data');
                }
            } catch (error) {
                console.error(error);
                setMessage(error.message || 'Error loading guide selection data.');
            } finally {
                setLoading(false);
            }
        };

        const pollFaculty = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const facRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/available`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                if (facRes.ok) {
                    const data = await facRes.json();
                    setFacultyList(data);
                }
            } catch (e) {
                // Silently ignore polling errors to prevent UI disruption
            }
        };

        let intervalId;
        fetchData().then(() => {
            // Start polling every 3 seconds to keep slots completely synced across all students
            intervalId = setInterval(pollFaculty, 3000);
        });

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    const handleSelectGuide = async (faculty) => {
        if (!window.confirm(`Are you sure you want to select Prof. ${faculty.name} as your guide? This cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('sarc_token');
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
            try {
                const token = localStorage.getItem('sarc_token');
                // Refresh team data
                const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/my`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (teamRes.ok) setTeam(await teamRes.json());

                // Always refresh faculty list to get the absolute latest slot availability
                const facRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/available`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (facRes.ok) setFacultyList(await facRes.json());
            } catch (e) {
                console.error("Failed to refresh data", e);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    if (!team || team.status === 'FORMING') {
        return <div className="p-8 text-center text-red-500">Your team is not finalized yet.</div>;
    }

    if (message && message === 'Guide Selection is not currently active.') {
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
