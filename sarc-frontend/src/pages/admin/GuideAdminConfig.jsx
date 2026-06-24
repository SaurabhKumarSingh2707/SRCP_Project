import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PhaseStepperAdmin from '../../components/guide/PhaseStepperAdmin';
import Button from '../../components/common/Button';
const GuideAdminConfig = () => {
    const queryClient = useQueryClient();

    const [message, setMessage] = useState('');
    const [dropIncomplete, setDropIncomplete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { data: configData, isLoading: configLoading } = useQuery({
        queryKey: ['guideConfig'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch guide config');
            return res.json();
        },
        staleTime: 60 * 1000 // 1 min cache
    });

    const { data: systemConfig, isLoading: systemLoading } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch system config');
            return res.json();
        },
        staleTime: 5 * 60 * 1000 // Re-uses Dashboard Layout Cache
    });

    const handleToggleResearchCollab = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isResearchCollaborationActive: !systemConfig.isResearchCollaborationActive })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleToggleTeamCreation = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isTeamCreationEnabled: !systemConfig.isTeamCreationEnabled })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleChangePhase = async (newPhase) => {
        if (!window.confirm(`Are you sure you want to advance to the ${newPhase} phase? This cannot be undone.`)) return;

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config/phase`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ phase: newPhase, dropIncompleteTeams: dropIncomplete })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage(data.message);
            
            // Instantly update the UI so the stepper changes immediately
            queryClient.setQueryData(['guideConfig'], (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    config: {
                        ...oldData.config,
                        phase: newPhase
                    }
                };
            });
            
            // Trigger a background sync
            await queryClient.invalidateQueries({ queryKey: ['guideConfig'] });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateSlot = async (facultyId, newSlots) => {
        try {
            const token = localStorage.getItem('sarc_token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty-slots/${facultyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ totalSlots: newSlots })
            });
            await queryClient.invalidateQueries({ queryKey: ['guideConfig'] });
        } catch (error) {
            console.error('Error updating slot:', error);
        }
    };

    const handleRestartPhase = async () => {
        if (!window.confirm('Are you absolutely sure you want to RESTART the guide selection phase? This will wipe ALL team formations, invitations, and faculty selections! This action is PERMANENT.')) return;
        
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/config/reset`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            
            // Instantly update the UI so the stepper resets immediately
            queryClient.setQueryData(['guideConfig'], (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    config: {
                        ...oldData.config,
                        phase: 'CLOSED'
                    }
                };
            });

            await queryClient.invalidateQueries({ queryKey: ['guideConfig'] });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/export`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch export data');
            const data = await res.json();
            
            const formattedData = data.map(team => ({
                'Team ID': team.id,
                'Project Title': team.description,
                'Domain': team.domain,
                'Guide Name': team.guide?.fullName || 'N/A',
                'Guide Department': team.guide?.facultyProfile?.department || 'N/A',
                'Leader Name': team.leader?.fullName || 'N/A',
                'Leader ID': team.leader?.registerNumber || 'N/A',
                'Member 1 Name': team.members[0]?.user?.fullName || '',
                'Member 1 ID': team.members[0]?.user?.registerNumber || '',
                'Member 2 Name': team.members[1]?.user?.fullName || '',
                'Member 2 ID': team.members[1]?.user?.registerNumber || '',
            }));

            const XLSX = await import('xlsx');
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams');
            XLSX.writeFile(workbook, 'Guide_Selection_Finalized_Teams.xlsx');
            
            setMessage('Data exported successfully!');
        } catch (error) {
            console.error('Error exporting teams:', error);
            setMessage('Error exporting teams to Excel.');
        }
    };

    const { config, stats, facultySlots } = configData || {};

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">System & Guide Configuration</h1>
            <p className="text-text-secondary mb-8">Manage system features and phases for the project guide selection process.</p>

            {(configLoading || systemLoading || !configData) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm mt-8">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading configuration...</p>
                </div>
            ) : (
                <>

            {message && (
                <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6">
                    {message}
                </div>
            )}

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Global Features</h2>
                <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas">
                    <div>
                        <h3 className="font-semibold text-text-primary">Research Collaboration Module</h3>
                        <p className="text-sm text-text-secondary">Enable or disable the research collaboration section for students.</p>
                    </div>
                    {systemConfig && (
                        <button 
                            onClick={handleToggleResearchCollab}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isResearchCollaborationActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            {systemConfig.isResearchCollaborationActive ? 'Enabled' : 'Disabled'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Phase Control</h2>
                <PhaseStepperAdmin currentPhase={config.phase} />
                
                <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas mt-6">
                    <div>
                        <h3 className="font-semibold text-text-primary">Team Creation</h3>
                        <p className="text-sm text-text-secondary">Enable or disable the ability for students to create new project teams.</p>
                    </div>
                    {systemConfig && (
                        <button 
                            onClick={handleToggleTeamCreation}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isTeamCreationEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            {systemConfig.isTeamCreationEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    )}
                </div>
                
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-border pt-6">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="dropIncomplete"
                            checked={dropIncomplete}
                            onChange={(e) => setDropIncomplete(e.target.checked)}
                            className="w-4 h-4 rounded text-accent focus:ring-accent"
                        />
                        <label htmlFor="dropIncomplete" className="text-sm text-text-secondary">
                            Drop incomplete teams when moving to Faculty Selection phase
                        </label>
                    </div>

                    <div className="flex gap-2">
                        {config.phase === 'CLOSED' && (
                            <Button onClick={() => handleChangePhase('FACULTY_SELECTION')} isLoading={isProcessing} disabled={isProcessing}>Open Faculty Selection</Button>
                        )}
                        {config.phase === 'FACULTY_SELECTION' && (
                            <>
                                <Button onClick={() => handleChangePhase('STUDENT_SELECTION')} isLoading={isProcessing} disabled={isProcessing}>Open Student Selection</Button>
                                <Button onClick={() => handleChangePhase('CLOSED')} className="bg-yellow-600 hover:bg-yellow-700" isLoading={isProcessing} disabled={isProcessing}>Revert to Closed</Button>
                            </>
                        )}
                        {config.phase === 'STUDENT_SELECTION' && (
                            <>
                                <Button onClick={() => handleChangePhase('COMPLETED')} className="bg-green-600 hover:bg-green-700" isLoading={isProcessing} disabled={isProcessing}>Mark Completed</Button>
                                <Button onClick={() => handleChangePhase('FACULTY_SELECTION')} className="bg-yellow-600 hover:bg-yellow-700" isLoading={isProcessing} disabled={isProcessing}>Revert to Faculty Selection</Button>
                            </>
                        )}
                        {config.phase === 'COMPLETED' && (
                            <>
                                <Button onClick={handleExportExcel} className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>Export Excel</Button>
                                <Button onClick={() => handleChangePhase('STUDENT_SELECTION')} className="bg-yellow-600 hover:bg-yellow-700" isLoading={isProcessing} disabled={isProcessing}>Reopen Student Selection</Button>
                            </>
                        )}
                        <Button onClick={handleRestartPhase} className="bg-red-600 hover:bg-red-700" isLoading={isProcessing} disabled={isProcessing}>Wipe & Restart</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalTeams}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Total Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-accent mb-1">{stats.teamsMatchedFaculty + stats.teamsMatchedStudent}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Matched Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-yellow-500 mb-1">{stats.unmatchedTeams}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Unmatched Teams</p>
                </div>
                <div className="bg-surface border border-border p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-green-500 mb-1">{stats.openSlotsFacultyCount}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider">Faculty w/ Slots</p>
                </div>
            </div>

            <div className="bg-surface/50 border border-border p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-text-primary mb-4">Faculty Slot Management</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-sm font-medium text-text-secondary">Faculty Name</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Department</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Used Slots</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Total Slots</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facultySlots.map(slot => (
                                <tr key={slot.id} className="border-b border-border/50 hover:bg-surface/80">
                                    <td className="p-3 text-sm text-text-primary font-medium">{slot.faculty.fullName}</td>
                                    <td className="p-3 text-sm text-text-secondary">{slot.faculty.facultyProfile?.department}</td>
                                    <td className="p-3 text-sm text-text-primary">{slot.usedSlots}</td>
                                    <td className="p-3 text-sm">
                                        <input 
                                            type="number" 
                                            defaultValue={slot.totalSlots}
                                            onBlur={(e) => handleUpdateSlot(slot.facultyId, e.target.value)}
                                            className="w-20 bg-canvas border border-border rounded-lg px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-accent"
                                            min={slot.usedSlots}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {facultySlots.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-text-secondary">No faculty slots initialized. This happens when Faculty Selection phase begins.</td>
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

export default GuideAdminConfig;
