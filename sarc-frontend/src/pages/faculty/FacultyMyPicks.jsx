import React, { useState, useEffect } from 'react';
import TeamCard from '../../components/guide/TeamCard';

const FacultyMyPicks = () => {
    const [selections, setSelections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSelections = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/my-selections`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Failed to fetch selections');
                const data = await res.json();
                setSelections(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSelections();
    }, []);

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Selected Teams</h1>
            <p className="text-text-secondary mb-8">Track the status of the teams you have invited to guide.</p>

            {selections.length === 0 ? (
                <div className="text-center py-12 bg-surface/50 border border-border rounded-2xl">
                    <p className="text-text-secondary">You haven't selected any teams yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selections.map(selection => (
                        <div key={selection.team.id} className="relative">
                            <TeamCard 
                                team={{
                                    ...selection.team,
                                    guideStatus: selection.status // Override status for display based on selection status
                                }} 
                                showStatus={true}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyMyPicks;
