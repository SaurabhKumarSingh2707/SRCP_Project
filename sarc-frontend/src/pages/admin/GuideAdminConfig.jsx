import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PhaseStepperAdmin from '../../components/guide/PhaseStepperAdmin';
import Button from '../../components/common/Button';
const GuideAdminConfig = () => {
    const queryClient = useQueryClient();

    const [message, setMessage] = useState('');
    const [dropIncomplete, setDropIncomplete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [phaseOneInstructions, setPhaseOneInstructions] = useState([]);
    
    // Checklist state
    const [checklistModalOpen, setChecklistModalOpen] = useState(false);
    const [selectedReviewForChecklist, setSelectedReviewForChecklist] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);

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
            const data = await res.json();
            setPhaseOneInstructions(data.phaseOneInstructions || []);
            return data;
        },
        staleTime: 5 * 60 * 1000 // Re-uses Dashboard Layout Cache
    });

    const handleUpdateInstructions = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ phaseOneInstructions })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage('Instructions updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInstructionChange = (index, field, value) => {
        const newInst = [...phaseOneInstructions];
        // Safely upgrade existing string state to object if needed
        if (typeof newInst[index] === 'string') {
            newInst[index] = { title: '', description: newInst[index], type: 'INFO' };
        }
        newInst[index] = { ...newInst[index], [field]: value };
        setPhaseOneInstructions(newInst);
    };

    const handleAddInstruction = () => {
        setPhaseOneInstructions([...phaseOneInstructions, { title: '', description: '', type: 'INFO' }]);
    };

    const handleRemoveInstruction = (index) => {
        const newInst = phaseOneInstructions.filter((_, i) => i !== index);
        setPhaseOneInstructions(newInst);
    };

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

    const handleTogglePhaseOneUpload = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isPhaseOneUploadEnabled: !systemConfig.isPhaseOneUploadEnabled })
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

    const handleToggleTeamEditing = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isTeamEditingEnabled: !systemConfig.isTeamEditingEnabled })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleToggleFacultyTeamEditing = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isFacultyTeamEditingEnabled: !systemConfig.isFacultyTeamEditingEnabled })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(data.message);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleToggleActiveReviewPhase = async (phase) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ activeReviewPhase: phase })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(`Review Phase set to ${phase}`);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleToggleReviewSchedule = async (reviewName, isActive) => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/review-schedule/${reviewName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ isActive })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setMessage(`Review ${isActive ? 'activated' : 'deactivated'} successfully`);
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

    const handleExportReviewExcel = async (reviewName, exportType = 'TEAM') => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/reviews/export/${reviewName}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch export data');
            const data = await res.json();
            
            const reviewSchedule = systemConfig?.reviewSchedules?.find(r => r.reviewName === reviewName);
            const globalChecklist = reviewSchedule?.checklist || [];

            let formattedData = [];

            if (exportType === 'TEAM') {
                formattedData = data.map(team => {
                    const reviewRecord = team.reviews?.find(r => r.reviewName === reviewName);
                    
                    const baseData = {
                        'Team ID': team.id,
                        'Project Title': team.description,
                        'Domain': team.domain,
                        'Guide Name': team.guide?.fullName || 'N/A',
                        'Member 1 Name': team.leader?.fullName || '',
                        'Member 1 ID': team.leader?.registerNumber || '',
                        'Member 2 Name': team.members?.[0]?.user?.fullName || '',
                        'Member 2 ID': team.members?.[0]?.user?.registerNumber || '',
                        'Member 3 Name': team.members?.[1]?.user?.fullName || '',
                        'Member 3 ID': team.members?.[1]?.user?.registerNumber || '',
                        'Member 4 Name': team.members?.[2]?.user?.fullName || '',
                        'Member 4 ID': team.members?.[2]?.user?.registerNumber || '',
                        'Approval Status': reviewRecord?.isApproved ? 'Approved (Completed)' : 'Pending'
                    };

                    globalChecklist.forEach(item => {
                        const isChecked = reviewRecord?.checkedItems?.includes(item);
                        baseData[item] = isChecked ? 'Yes' : 'No';
                    });

                    return baseData;
                });
            } else if (exportType === 'STUDENT') {
                data.forEach(team => {
                    const reviewRecord = team.reviews?.find(r => r.reviewName === reviewName);
                    
                    const students = [];
                    if (team.leader) students.push(team.leader);
                    if (team.members) {
                        team.members.forEach(m => {
                            if (m.user) students.push(m.user);
                        });
                    }

                    students.forEach(student => {
                        const rowData = {
                            'Student Name': student.fullName || '',
                            'Student ID': student.registerNumber || '',
                            'Guide Name': team.guide?.fullName || 'N/A',
                            'Team ID': team.id,
                            'Project Title': team.description,
                            'Domain': team.domain,
                            'Approval Status': reviewRecord?.isApproved ? 'Approved (Completed)' : 'Pending'
                        };

                        globalChecklist.forEach(item => {
                            const isChecked = reviewRecord?.checkedItems?.includes(item);
                            rowData[item] = isChecked ? 'Yes' : 'No';
                        });

                        formattedData.push(rowData);
                    });
                });
            }

            const XLSX = await import('xlsx');
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'ReviewData');
            XLSX.writeFile(workbook, `Guide_Selection_${reviewName}_${exportType}_Data.xlsx`);
            
            setMessage(`Review data for ${reviewName} exported successfully!`);
        } catch (error) {
            console.error('Error exporting review data:', error);
            setMessage('Error exporting review data to Excel.');
        }
    };

    const handleOpenChecklistModal = (review) => {
        setSelectedReviewForChecklist(review);
        setChecklistItems([...(review.checklist || [])]);
        setChecklistModalOpen(true);
    };

    const handleSaveChecklist = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/reviews/${selectedReviewForChecklist.reviewName}/checklist`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                credentials: 'include',
                body: JSON.stringify({ checklist: checklistItems })
            });
            if (!res.ok) throw new Error('Failed to update checklist');
            
            setMessage(`Checklist updated for ${selectedReviewForChecklist.title}`);
            setChecklistModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
        } catch (error) {
            console.error('Error updating checklist:', error);
            setMessage('Error updating checklist.');
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
                <div className="space-y-4">
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
                    <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas">
                        <div>
                            <h3 className="font-semibold text-text-primary">Phase I File Uploads</h3>
                            <p className="text-sm text-text-secondary">Allow students to upload their Basepaper and Presentation to Supabase.</p>
                        </div>
                        {systemConfig && (
                            <button 
                                onClick={handleTogglePhaseOneUpload}
                                className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isPhaseOneUploadEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                            >
                                {systemConfig.isPhaseOneUploadEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Phase I Review Instructions</h2>
                    <Button onClick={handleUpdateInstructions} isLoading={isProcessing} disabled={isProcessing}>
                        Save Instructions
                    </Button>
                </div>
                <p className="text-sm text-text-secondary mb-4">These instructions will be displayed on the student dashboard.</p>
                <div className="space-y-4">
                    {phaseOneInstructions.map((inst, index) => {
                        const instObj = typeof inst === 'string' ? { title: '', description: inst, type: 'INFO', targetDate: null } : inst;
                        
                        const formatDateForInput = (dateString) => {
                            if (!dateString) return '';
                            const d = new Date(dateString);
                            if (isNaN(d)) return '';
                            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        };

                        const handleSplitList = () => {
                            if (!instObj.description) return;
                            // Regex to match "1. ", "2. ", etc at the start of a line
                            const parts = instObj.description.split(/(?:^|\n)\d+\.\s+/).filter(Boolean);
                            if (parts.length > 1) {
                                const newInst = [...phaseOneInstructions];
                                // Update current to be the first part
                                newInst[index] = { ...instObj, description: parts[0].trim() };
                                // Insert the rest
                                const additionalInst = parts.slice(1).map(part => ({
                                    title: instObj.title ? `${instObj.title} (Cont.)` : '',
                                    description: part.trim(),
                                    type: instObj.type,
                                    targetDate: instObj.targetDate
                                }));
                                newInst.splice(index + 1, 0, ...additionalInst);
                                setPhaseOneInstructions(newInst);
                            } else {
                                alert("No numbered list found to split (e.g., '1. text\\n2. text').");
                            }
                        };

                        return (
                            <div key={index} className="flex gap-4 items-start bg-canvas p-4 rounded-xl border border-border relative">
                                <span className="bg-surface border border-border rounded w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">{index + 1}</span>
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={instObj.title || ''}
                                            onChange={(e) => handleInstructionChange(index, 'title', e.target.value)}
                                            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                                            placeholder="Instruction Title (e.g., Submit Draft)"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={formatDateForInput(instObj.targetDate)}
                                            onChange={(e) => handleInstructionChange(index, 'targetDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-accent"
                                            title="Target Date / Deadline"
                                        />
                                        <select
                                            value={instObj.type || 'INFO'}
                                            onChange={(e) => handleInstructionChange(index, 'type', e.target.value)}
                                            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                                        >
                                            <option value="INFO">Info (Blue)</option>
                                            <option value="WARNING">Warning (Yellow)</option>
                                            <option value="MANDATORY_ACTION">Critical (Red)</option>
                                        </select>
                                    </div>
                                    <textarea 
                                        value={instObj.description || ''}
                                        onChange={(e) => handleInstructionChange(index, 'description', e.target.value)}
                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[80px]"
                                        placeholder="Detailed instruction description..."
                                    />
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleSplitList}
                                            className="text-xs text-accent hover:underline flex items-center gap-1"
                                            title="If you pasted a numbered list, this will split it into separate instructions."
                                        >
                                            Auto-Split Numbered List
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemoveInstruction(index)}
                                    className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-lg p-2 h-10 w-10 flex items-center justify-center transition-colors shrink-0 mt-1"
                                    title="Remove Instruction"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                    <button 
                        onClick={handleAddInstruction}
                        className="w-full mt-2 border border-dashed border-border hover:border-accent hover:text-accent text-text-secondary bg-surface/50 rounded-lg py-3 text-sm font-medium transition-colors"
                    >
                        + Add Instruction
                    </button>
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

                <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas mt-4">
                    <div>
                        <h3 className="font-semibold text-text-primary">Student Team Editing</h3>
                        <p className="text-sm text-text-secondary">Enable or disable the ability for students to edit their team details.</p>
                    </div>
                    {systemConfig && (
                        <button 
                            onClick={handleToggleTeamEditing}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isTeamEditingEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            {systemConfig.isTeamEditingEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between border border-border p-4 rounded-xl bg-canvas mt-4">
                    <div>
                        <h3 className="font-semibold text-text-primary">Faculty Team Editing</h3>
                        <p className="text-sm text-text-secondary">Enable or disable the ability for faculty guides to edit project titles of their allocated teams.</p>
                    </div>
                    {systemConfig && (
                        <button 
                            onClick={handleToggleFacultyTeamEditing}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${systemConfig.isFacultyTeamEditingEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                            {systemConfig.isFacultyTeamEditingEnabled ? 'Enabled' : 'Disabled'}
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

            <div className="bg-surface/50 border border-border p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Review Schedule Management</h2>
                <div className="mb-6 flex flex-wrap items-center gap-4 border border-border p-4 rounded-xl bg-canvas">
                    <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">Active Review Phase</h3>
                        <p className="text-sm text-text-secondary">Set the current active phase. This restricts which reviews can be activated.</p>
                    </div>
                    <select 
                        value={systemConfig?.activeReviewPhase || 'CLOSED'} 
                        onChange={(e) => handleToggleActiveReviewPhase(e.target.value)}
                        className="p-2 border border-border rounded-lg bg-surface text-text-primary font-bold"
                    >
                        <option value="CLOSED">CLOSED</option>
                        <option value="PHASE_1">Phase 1</option>
                        <option value="PHASE_2">Phase 2</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-sm font-medium text-text-secondary">Review Phase</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Review Title</th>
                                <th className="p-3 text-sm font-medium text-text-secondary">Status</th>
                                <th className="p-3 text-sm font-medium text-text-secondary text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {systemConfig?.reviewSchedules?.map(review => (
                                <tr key={review.reviewName} className="border-b border-border/50 hover:bg-surface/80">
                                    <td className="p-3 text-sm text-text-secondary">{review.phase}</td>
                                    <td className="p-3 text-sm text-text-primary font-medium">{review.title}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${review.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {review.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleOpenChecklistModal(review)}
                                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors bg-purple-100 text-purple-600 hover:bg-purple-200"
                                        >
                                            Manage Checklist
                                        </button>
                                        <button 
                                            onClick={() => handleExportReviewExcel(review.reviewName, 'TEAM')}
                                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200"
                                        >
                                            Export (Team)
                                        </button>
                                        <button 
                                            onClick={() => handleExportReviewExcel(review.reviewName, 'STUDENT')}
                                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200"
                                        >
                                            Export (Student)
                                        </button>
                                        <button 
                                            onClick={() => handleToggleReviewSchedule(review.reviewName, !review.isActive)}
                                            disabled={!review.isActive && systemConfig?.activeReviewPhase !== review.phase}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                                review.isActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-accent/10 text-accent hover:bg-accent/20'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {review.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
            
            {/* Checklist Modal */}
            {checklistModalOpen && selectedReviewForChecklist && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-lg border border-border shadow-xl">
                        <h2 className="text-xl font-bold text-text-primary mb-4">Manage Checklist for {selectedReviewForChecklist.title}</h2>
                        
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                            {checklistItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={item}
                                        onChange={(e) => {
                                            const newItems = [...checklistItems];
                                            newItems[idx] = e.target.value;
                                            setChecklistItems(newItems);
                                        }}
                                        className="flex-1 p-2 border border-border rounded-lg bg-canvas text-sm focus:border-accent outline-none"
                                        placeholder="e.g. Shown PPT"
                                    />
                                    <button 
                                        onClick={() => {
                                            const newItems = [...checklistItems];
                                            newItems.splice(idx, 1);
                                            setChecklistItems(newItems);
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {checklistItems.length === 0 && (
                                <p className="text-sm text-text-secondary text-center py-4">No checklist items added yet.</p>
                            )}
                        </div>
                        
                        <div className="flex gap-2 mb-6">
                            <button 
                                onClick={() => setChecklistItems([...checklistItems, ''])}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors w-full"
                            >
                                + Add Item
                            </button>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <button 
                                onClick={() => setChecklistModalOpen(false)}
                                className="px-4 py-2 text-text-secondary hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <Button onClick={handleSaveChecklist}>
                                Save Checklist
                            </Button>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
};

export default GuideAdminConfig;
