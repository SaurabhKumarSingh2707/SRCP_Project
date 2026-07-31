import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Users, FileText, ArrowLeft, Award, Hash, BookOpen, Layers, CheckCircle2, Check, LayoutTemplate, Edit2, X, Upload, Trash2, Download, File, Eye } from 'lucide-react';
import Button from '../../components/common/Button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import TeamInstructions from '../../components/common/TeamInstructions';

const TeamDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const initialTeam = location.state?.team;
    
    // Support local state for immediate update without refetching if coming from state
    const [team, setTeam] = useState(initialTeam);
    const userRole = (localStorage.getItem('sarc_role') || '').toUpperCase();
    const { data: authData } = useQuery({
        queryKey: ['authMe'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to load profile data");
            return response.json();
        },
        staleTime: 5 * 60 * 1000
    });

    const currentUserId = authData?.id;
    const isCurrentUserLeader = team?.leaderId === currentUserId || team?.leader?.id === currentUserId;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(team?.name || '');
    const [editDescription, setEditDescription] = useState(team?.description || '');
    const [editDomain, setEditDomain] = useState(team?.domain || '');
    const queryClient = useQueryClient();

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadingType, setUploadingType] = useState(null);
    const [viewingFile, setViewingFile] = useState(null);

    const { data: systemConfig, isLoading: isConfigLoading } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`);
            if (!res.ok) throw new Error('Failed to fetch config');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: fetchedTeam, isLoading: isTeamLoading } = useQuery({
        queryKey: ['teamDetails', id],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch team');
            return res.json();
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (fetchedTeam) {
            setTeam(fetchedTeam);
            setEditTitle(fetchedTeam.name || '');
            setEditDescription(fetchedTeam.description || '');
            setEditDomain(fetchedTeam.domain || '');
            
            // Refetch uploaded files when team is loaded
            fetchUploadedFiles();
        }
    }, [fetchedTeam]);

    const fetchUploadedFiles = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/${id}/upload-proxy`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch uploaded files');
            const data = await res.json();
            setUploadedFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder') || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (id && systemConfig?.isPhaseOneUploadEnabled) {
            fetchUploadedFiles();
        }
    }, [id, systemConfig]);

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            e.target.value = '';
            return alert("File size must be under 4MB");
        }

        if (type === 'basepaper' && file.type !== 'application/pdf') {
            e.target.value = '';
            return alert("Basepaper must be a PDF file");
        }
        
        const isPpt = file.name.endsWith('.ppt') || file.name.endsWith('.pptx') || file.type.includes('presentation');
        if (type === 'presentation' && !isPpt) {
            e.target.value = '';
            return alert("Presentation must be a PPT/PPTX file");
        }

        let fileName = file.name;
        if (type === 'presentation') {
            const ext = file.name.substring(file.name.lastIndexOf('.'));
            fileName = 'presentation' + (ext || '.pptx');
        } else {
            const exists = uploadedFiles.some(f => f.name === file.name);
            if (exists) {
                e.target.value = '';
                return alert("A file with this name has already been uploaded.");
            }
        }

        setUploadingType(type);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', fileName);
            
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/${id}/upload-proxy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            setUploadingType(null);
            if (!res.ok) {
                const errData = await res.json();
                alert("Upload failed: " + (errData.message || 'Server error'));
            } else {
                alert("Upload successful!");
                fetchUploadedFiles();
            }
        } catch (err) {
            setUploadingType(null);
            alert("Upload failed: " + err.message);
        }
        
        e.target.value = '';
    };

    const handleDeleteFile = async (fileName) => {
        if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;
        
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/${id}/upload-proxy`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName })
            });
            if (!res.ok) throw new Error('Failed to delete file');
            fetchUploadedFiles();
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    const getFileUrl = (fileObj) => {
        return fileObj.publicUrl || '#';
    };

    const editMutation = useMutation({
        mutationFn: async (data) => {
            const token = localStorage.getItem('sarc_token');
            const endpoint = userRole === 'ADMIN' 
                ? `/api/guide/admin/teams/${team.id}/edit-details`
                : `/api/guide/faculty/teams/${team.id}/edit-details`;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update details');
            }
            return res.json();
        },
        onSuccess: (data) => {
            alert('Project details updated successfully!');
            setTeam(data.team);
            setIsEditModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['allocatedTeams'] });
            queryClient.invalidateQueries({ queryKey: ['teamDetails', id] });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editTitle.trim() || !editDescription.trim() || !editDomain.trim()) {
            return alert("Title, description, and domain cannot be empty");
        }
        editMutation.mutate({ title: editTitle, description: editDescription, domain: editDomain });
    };

    const checklistMutation = useMutation({
        mutationFn: async ({ checkedItems }) => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/teams/${team.id}/review-checklist`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ checkedItems })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update checklist');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamDetails', id] });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const handleToggleChecklistItem = (item, isCurrentlyChecked, reviewRecord) => {
        let newCheckedItems = reviewRecord?.checkedItems || [];
        if (isCurrentlyChecked) {
            newCheckedItems = newCheckedItems.filter(i => i !== item);
        } else {
            newCheckedItems = [...newCheckedItems, item];
        }

        // Optimistic update for instant UI response
        setTeam(prevTeam => {
            if (!prevTeam) return prevTeam;
            const updatedTeam = { ...prevTeam };
            if (!updatedTeam.reviews) {
                updatedTeam.reviews = [];
            }
            const reviewIndex = updatedTeam.reviews.findIndex(r => r.reviewName === reviewRecord.reviewName);
            
            if (reviewIndex !== -1) {
                updatedTeam.reviews[reviewIndex] = {
                    ...updatedTeam.reviews[reviewIndex],
                    checkedItems: newCheckedItems
                };
            } else {
                updatedTeam.reviews.push({
                    reviewName: reviewRecord.reviewName,
                    checkedItems: newCheckedItems,
                    isApproved: false
                });
            }
            return updatedTeam;
        });

        checklistMutation.mutate({ checkedItems: newCheckedItems });
    };

    const approvalMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/faculty/teams/${team.id}/review-approval`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to toggle approval');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamDetails', id] });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const handleToggleApproval = (reviewName, isCurrentlyApproved) => {
        if (window.confirm("Are you sure you want to toggle approval status for this team?")) {
            // Optimistic update for instant UI response
            setTeam(prevTeam => {
                if (!prevTeam) return prevTeam;
                const updatedTeam = { ...prevTeam };
                if (!updatedTeam.reviews) {
                    updatedTeam.reviews = [];
                }
                const reviewIndex = updatedTeam.reviews.findIndex(r => r.reviewName === reviewName);
                
                if (reviewIndex !== -1) {
                    updatedTeam.reviews[reviewIndex] = {
                        ...updatedTeam.reviews[reviewIndex],
                        isApproved: !isCurrentlyApproved,
                        approvedAt: !isCurrentlyApproved ? new Date().toISOString() : null
                    };
                } else {
                    updatedTeam.reviews.push({
                        reviewName: reviewName,
                        checkedItems: [],
                        isApproved: !isCurrentlyApproved,
                        approvedAt: !isCurrentlyApproved ? new Date().toISOString() : null
                    });
                }
                return updatedTeam;
            });

            approvalMutation.mutate();
        }
    };

    const isPdf = viewingFile && viewingFile.name.toLowerCase().endsWith('.pdf');
    const isPpt = viewingFile && (viewingFile.name.toLowerCase().endsWith('.ppt') || viewingFile.name.toLowerCase().endsWith('.pptx'));
    let viewerUrl = viewingFile ? getFileUrl(viewingFile) : '';
    if (isPpt) {
        viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(viewerUrl)}&embedded=true`;
    }

    const DocumentViewerModal = () => viewingFile ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-5xl shadow-xl flex flex-col h-[90vh]">
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50 rounded-t-2xl">
                    <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" />
                        {viewingFile.name}
                    </h3>
                    <div className="flex items-center gap-3">
                        <a 
                            href={getFileUrl(viewingFile)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-sm font-semibold rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                        <button 
                            onClick={() => setViewingFile(null)}
                            className="p-1.5 hover:bg-canvas rounded-lg transition-colors text-text-secondary hover:text-text-primary"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-canvas overflow-hidden rounded-b-2xl relative">
                    {(isPdf || isPpt) ? (
                        <iframe 
                            src={viewerUrl}
                            className="w-full h-full border-0"
                            title="Document Viewer"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary flex-col gap-3 p-8 text-center">
                            <File className="w-12 h-12 text-border" />
                            <p>Preview is not available for this file type.</p>
                            <a 
                                href={getFileUrl(viewingFile)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-accent hover:underline mt-2 inline-flex items-center gap-1"
                            >
                                <Download className="w-4 h-4" />
                                Download to view
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    if (isTeamLoading && !team) {
        return <div className="py-20 text-center text-text-secondary">Loading team details...</div>;
    }

    if (!team) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="bg-surface border border-border p-8 rounded-2xl shadow-sm text-center max-w-md">
                    <LayoutTemplate className="w-12 h-12 text-accent/50 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-text-primary mb-2">Team Not Found</h2>
                    <p className="text-sm text-text-secondary mb-6">The details for this team could not be loaded. Please return to the dashboard and try again.</p>
                    <Button onClick={() => navigate(-1)} className="w-full">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-fade-in">
            {/* Minimalist Top Navigation */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all shadow-sm"
                    title="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                    <span className="hover:text-text-primary cursor-pointer transition-colors" onClick={() => navigate(-1)}>Go Back</span>
                    <span className="text-border">/</span>
                    <span className="text-text-primary">Team Details</span>
                </div>
            </div>

            {/* Premium Header Banner */}
            <div className="relative bg-surface rounded-3xl p-8 sm:p-10 border border-border shadow-sm overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase tracking-wider border border-accent/20">
                                <Layers className="w-3.5 h-3.5" />
                                {team.domain}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-canvas text-text-secondary font-semibold text-xs border border-border">
                                <Hash className="w-3.5 h-3.5" />
                                {team.id}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider border ${
                                team.status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                team.status === 'REQUESTED_GUIDE' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                team.status === 'FINALIZED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {team.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-text-primary leading-tight tracking-tight">
                            {team.name}
                        </h1>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        {((userRole === 'FACULTY' && !isConfigLoading && systemConfig?.isFacultyTeamEditingEnabled !== false) || userRole === 'ADMIN') && (
                            <Button onClick={() => setIsEditModalOpen(true)} className="gap-2 px-6 py-3.5 rounded-xl shadow-lg">
                                <Edit2 className="w-4 h-4" />
                                Edit Details
                            </Button>
                        )}
                        {team.abstractFile && (
                            <a 
                                href={`${import.meta.env.VITE_API_URL}/uploads/${team.abstractFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-text-primary text-surface hover:bg-accent rounded-xl transition-all shadow-lg font-semibold text-sm w-full md:w-auto"
                            >
                                <FileText className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                View Project Abstract
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column (Wider - ~65%) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Project Overview */}
                    <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Project Overview</h3>
                        </div>
                        <div className="prose prose-sm sm:prose-base max-w-none text-text-secondary leading-loose">
                            <p className="whitespace-pre-wrap">{team.description}</p>
                        </div>
                    </div>

                    {/* Team Roster */}
                    <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">Team Roster</h3>
                            </div>
                            <span className="inline-flex px-4 py-1.5 bg-canvas rounded-lg text-sm font-bold text-text-secondary border border-border shadow-sm">
                                {team.members?.filter(m => m.inviteStatus !== 'REJECTED').length || 0} Members
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.members?.filter(m => m.inviteStatus !== 'REJECTED').map((member) => (
                                <div key={member.id} className="group bg-canvas border border-border hover:border-accent/30 rounded-2xl p-5 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        {/* Profile Picture Wrapper */}
                                        <div className="relative">
                                            {member.isLeader && (
                                                <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 z-10 text-2xl drop-shadow-md cursor-default" title="Team Leader">
                                                    👑
                                                </div>
                                            )}
                                            <div className="w-14 h-14 rounded-full bg-surface border-2 border-border flex items-center justify-center shadow-sm overflow-hidden relative z-0">
                                                {member.user?.profilePhoto ? (
                                                    <img src={member.user.profilePhoto.startsWith('http') ? member.user.profilePhoto : `${import.meta.env.VITE_API_URL}/uploads/${member.user.profilePhoto.split(/[\\/]/).pop()}`} alt={member.user.fullName} className="w-full h-full object-cover object-top" />
                                                ) : (
                                                    <span className="text-lg font-bold text-text-secondary uppercase">
                                                        {member.user?.fullName?.charAt(0) || '?'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-text-primary truncate" title={member.user?.fullName}>
                                                {member.user?.fullName || 'Unknown User'}
                                            </h4>
                                            <p className="text-xs text-text-secondary mt-1 font-medium">{member.user?.registerNumber || 'No Reg No'}</p>
                                            <div className="mt-3">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${
                                                    member.inviteStatus === 'ACCEPTED' ? 'bg-green-500/10 text-green-600' :
                                                    member.inviteStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                    {member.inviteStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase I Documents */}
                    {systemConfig?.isPhaseOneUploadEnabled && (
                        <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">Phase I Documents</h3>
                            </div>

                            {/* Upload Section (Student Only) */}
                            {userRole === 'STUDENT' && isCurrentUserLeader && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="border border-dashed border-border rounded-xl p-4 text-center hover:bg-canvas transition-colors">
                                        <h4 className="font-bold text-sm text-text-primary mb-1">Basepaper (PDF)</h4>
                                        <p className="text-xs text-text-secondary mb-3">Max 4MB. Multiple allowed.</p>
                                        <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${uploadingType === 'basepaper' ? 'bg-accent/50 text-surface cursor-not-allowed' : 'bg-accent text-surface hover:bg-accent/90'}`}>
                                            <Upload className="w-4 h-4" />
                                            {uploadingType === 'basepaper' ? 'Uploading...' : 'Upload Basepaper'}
                                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'basepaper')} disabled={!!uploadingType} />
                                        </label>
                                    </div>
                                    <div className="border border-dashed border-border rounded-xl p-4 text-center hover:bg-canvas transition-colors">
                                        <h4 className="font-bold text-sm text-text-primary mb-1">Presentation (PPT)</h4>
                                        <p className="text-xs text-text-secondary mb-3">Max 4MB. Single file (replaces old).</p>
                                        <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${uploadingType === 'presentation' ? 'bg-accent/50 text-surface cursor-not-allowed' : 'bg-accent text-surface hover:bg-accent/90'}`}>
                                            <Upload className="w-4 h-4" />
                                            {uploadingType === 'presentation' ? 'Uploading...' : 'Upload PPT'}
                                            <input type="file" accept=".ppt,.pptx" className="hidden" onChange={(e) => handleFileUpload(e, 'presentation')} disabled={!!uploadingType} />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Files List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest border-b border-border pb-2 mb-4">Uploaded Files</h4>
                                {uploadedFiles.length === 0 ? (
                                    <p className="text-sm text-text-secondary italic">No documents uploaded yet.</p>
                                ) : (
                                    uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-canvas border border-border rounded-xl hover:border-accent/30 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <File className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-text-primary truncate">{file.name}</p>
                                                    <p className="text-xs text-text-secondary mt-0.5">{(file.metadata.size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => setViewingFile(file)}
                                                    className="p-2 text-text-secondary hover:text-accent bg-surface border border-border hover:border-accent/30 rounded-lg transition-all"
                                                    title="View Document"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <a 
                                                    href={getFileUrl(file)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-text-secondary hover:text-accent bg-surface border border-border hover:border-accent/30 rounded-lg transition-all"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                {userRole === 'STUDENT' && isCurrentUserLeader && (
                                                    <button 
                                                        onClick={() => handleDeleteFile(file.name)}
                                                        className="p-2 text-red-500 hover:text-red-600 bg-red-50 border border-red-100 hover:border-red-200 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Evaluation Placeholder */}
                    {userRole === 'FACULTY' && (
                        <div className="bg-canvas border-2 border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center relative group hover:border-accent/30 transition-colors">
                            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Award className="w-8 h-8 text-text-secondary group-hover:text-accent transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Marks & Evaluation</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Grading rubrics and evaluation tools for this team will be integrated here in future updates.
                            </p>
                            <div className="mt-6 w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                                <div className="h-full bg-text-secondary/20 w-1/3 rounded-full"></div>
                            </div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-3">Coming Soon</p>
                        </div>
                    )}
                    
                    {/* Guide Instructions */}
                    <TeamInstructions 
                        teamId={id} 
                        userRole={userRole} 
                        isLeader={isCurrentUserLeader} 
                        isGuide={team.guideId === currentUserId || team.guide?.id === currentUserId} 
                    />
                </div>

                {/* Right Column (Narrower - ~35%) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Assigned Guide Card */}
                    {team.guide && (
                        <div className="bg-gradient-to-br from-surface to-surface border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] pointer-events-none"></div>
                            
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">
                                Assigned Guide
                            </h3>
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="flex flex-col items-center gap-1 mb-4">
                                    <div className="w-20 h-20 rounded-full bg-canvas border border-border flex items-center justify-center shadow-sm overflow-hidden">
                                        {team.guide.profilePhoto ? (
                                            <img src={team.guide.profilePhoto.startsWith('http') ? team.guide.profilePhoto : `${import.meta.env.VITE_API_URL}/uploads/${team.guide.profilePhoto.split(/[\\/]/).pop()}`} alt={team.guide.fullName} className="w-full h-full object-cover object-top" />
                                        ) : (
                                            <Award className="w-8 h-8 text-accent" />
                                        )}
                                    </div>
                                    <div className="bg-surface border border-border px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Guide</span>
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-text-primary">{team.guide.fullName}</h4>
                                {team.guide.facultyProfile?.department && (
                                    <p className="text-sm font-medium text-text-secondary mt-1">{team.guide.facultyProfile.department}</p>
                                )}
                                {team.selectionSource && (
                                    <p className="text-xs font-medium text-text-secondary mt-2 bg-canvas px-3 py-1 rounded-lg border border-border inline-block">
                                        {team.selectionSource === 'FACULTY' ? 'Selected by Faculty' : 'Selected by Student'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Review Approval Card */}
                    {systemConfig?.activeReviewPhase !== 'CLOSED' && (
                        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                            
                            {(() => {
                                // Find active review
                                const activeReview = systemConfig?.reviewSchedules?.find(r => r.isActive);
                                if (!activeReview) return <p className="text-sm text-text-secondary text-center py-4">No active review currently.</p>;

                                // Check if this team is approved for the active review
                                const reviewRecord = team?.reviews?.find(r => r.reviewName === activeReview.reviewName);
                                const isApproved = reviewRecord?.isApproved;

                                return (
                                    <div className="flex flex-col h-full">
                                        {/* Header Section */}
                                        <div className="flex flex-col gap-3 mb-6 pb-5 border-b border-border/60">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-text-primary">Review Approval</h3>
                                                    <p className="text-sm font-medium text-text-secondary mt-1">{activeReview.title}</p>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border shadow-sm ${
                                                    isApproved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                }`}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Checklist Section */}
                                        {activeReview.checklist && activeReview.checklist.length > 0 && (
                                            <div className="w-full mb-8">
                                                
                                                {userRole === 'STUDENT' && (() => {
                                                    const percentage = ((reviewRecord?.checkedItems?.length || 0) / activeReview.checklist.length) * 100;
                                                    let barColorClass = 'bg-accent';
                                                    if (percentage <= 33) {
                                                        barColorClass = 'bg-red-500';
                                                    } else if (percentage <= 66) {
                                                        barColorClass = 'bg-orange-500';
                                                    } else {
                                                        barColorClass = 'bg-green-500';
                                                    }
                                                    return (
                                                        <div className="mb-6">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-semibold text-text-primary">Checklist Progress</span>
                                                                <span className="text-sm font-bold text-text-secondary">{Math.round(percentage)}%</span>
                                                            </div>
                                                            <div className="w-full bg-canvas border border-border rounded-full h-2 overflow-hidden">
                                                                <div 
                                                                    className={`${barColorClass} h-full transition-all duration-300`} 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                
                                                <div className="space-y-3">
                                                    {activeReview.checklist.map((item, idx) => {
                                                        const isChecked = reviewRecord?.checkedItems?.includes(item);
                                                        return (
                                                            <label key={idx} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                                                                userRole === 'FACULTY' ? 'cursor-pointer hover:border-accent/40' : ''
                                                            } ${
                                                                isChecked ? 'bg-green-50/40 border-green-200' : 'bg-canvas border-border'
                                                            } transition-colors`}>
                                                                <div className="mt-0.5">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isChecked || false}
                                                                        onChange={() => {
                                                                            if (userRole === 'FACULTY') {
                                                                                handleToggleChecklistItem(item, isChecked, reviewRecord || { reviewName: activeReview.reviewName, checkedItems: [] });
                                                                            }
                                                                        }}
                                                                        disabled={userRole !== 'FACULTY' || checklistMutation.isLoading}
                                                                        className="w-5 h-5 rounded border-2 border-border text-green-500 focus:ring-green-500/20 cursor-pointer disabled:cursor-not-allowed"
                                                                    />
                                                                </div>
                                                                <span className={`text-sm leading-relaxed ${isChecked ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                                                                    {item}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button (Faculty) */}
                                        {userRole === 'FACULTY' && (
                                            <div className="mt-auto pt-2">
                                                <Button 
                                                    onClick={() => handleToggleApproval(activeReview.reviewName, isApproved)}
                                                    disabled={approvalMutation.isLoading}
                                                    variant={isApproved ? 'danger' : 'primary'}
                                                    className="w-full font-bold shadow-sm"
                                                >
                                                    {approvalMutation.isLoading 
                                                        ? 'Processing...' 
                                                        : isApproved 
                                                        ? 'Revoke Approval' 
                                                        : 'Approve Team for Review'
                                                    }
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Details Modal */}
            {isEditModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-accent" />
                                Edit Project Details
                            </h3>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-canvas text-text-secondary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-5">

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">
                                    Project Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                    placeholder="Enter refined project title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">
                                    Domain Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editDomain}
                                    onChange={(e) => setEditDomain(e.target.value)}
                                    className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                    placeholder="Enter refined project domain"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">
                                    Project Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none h-40"
                                    placeholder="Enter refined project description"
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editMutation.isLoading}>
                                    {editMutation.isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            <DocumentViewerModal />
        </div>
    );
};

export default TeamDetails;

