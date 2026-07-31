import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Check, Send, Clock, User, AlertCircle } from 'lucide-react';

const TeamInstructions = ({ teamId, userRole, isLeader, isGuide }) => {
    const queryClient = useQueryClient();
    const [newInstruction, setNewInstruction] = useState('');

    const { data: instructions, isLoading } = useQuery({
        queryKey: ['teamInstructions', teamId],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/instructions/${teamId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch instructions');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (content) => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/instructions/${teamId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error('Failed to send instruction');
            return res.json();
        },
        onSuccess: () => {
            setNewInstruction('');
            queryClient.invalidateQueries({ queryKey: ['teamInstructions', teamId] });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const markReadMutation = useMutation({
        mutationFn: async (instructionId) => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/instructions/${instructionId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamInstructions', teamId] });
        },
        onError: (err) => {
            alert(err.message);
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!newInstruction.trim()) return;
        createMutation.mutate(newInstruction);
    };

    if (isLoading) {
        return <div className="animate-pulse bg-surface p-8 rounded-3xl border border-border shadow-sm h-32"></div>;
    }

    // Students only see unread instructions (already filtered by backend, but safe to filter here)
    // Guides/Admins see all instructions
    const visibleInstructions = instructions || [];

    if (visibleInstructions.length === 0 && userRole !== 'FACULTY') {
        return null; // Don't show the section if no instructions for student
    }

    return (
        <div className="bg-surface rounded-3xl p-8 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">Guide Instructions</h3>
            </div>

            {/* Guide input form */}
            {(userRole === 'FACULTY' || isGuide) && (
                <form onSubmit={handleSend} className="mb-8">
                    <div className="relative">
                        <textarea
                            value={newInstruction}
                            onChange={(e) => setNewInstruction(e.target.value)}
                            placeholder="Type an instruction or message for the team..."
                            className="w-full bg-canvas border border-border rounded-xl p-4 pr-16 resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 min-h-[100px]"
                        ></textarea>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !newInstruction.trim()}
                            className="absolute bottom-4 right-4 p-2 bg-accent text-surface rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            )}

            {/* Instructions List */}
            <div className="space-y-4">
                {visibleInstructions.length === 0 ? (
                    <p className="text-sm text-text-secondary italic">No instructions sent yet.</p>
                ) : (
                    visibleInstructions.map((instruction) => (
                        <div 
                            key={instruction.id} 
                            className={`p-5 rounded-2xl border transition-colors ${
                                instruction.isRead ? 'bg-canvas border-border opacity-75' : 'bg-orange-50 border-orange-200 shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {!instruction.isRead && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white uppercase tracking-wider">
                                                New
                                            </span>
                                        )}
                                        <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(instruction.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className={`whitespace-pre-wrap text-sm leading-relaxed ${instruction.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                                        {instruction.content}
                                    </p>
                                    
                                    {/* Read Receipt info */}
                                    {instruction.isRead && instruction.readBy && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 w-fit px-2.5 py-1 rounded-md border border-green-200">
                                            <Check className="w-3.5 h-3.5" />
                                            Read by {instruction.readBy.fullName} on {new Date(instruction.readAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Mark as read button (Leader only) */}
                                {userRole === 'STUDENT' && isLeader && !instruction.isRead && (
                                    <button
                                        onClick={() => markReadMutation.mutate(instruction.id)}
                                        disabled={markReadMutation.isPending}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border text-text-secondary hover:text-green-600 hover:border-green-300 hover:bg-green-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                                    >
                                        <Check className="w-4 h-4" />
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamInstructions;
