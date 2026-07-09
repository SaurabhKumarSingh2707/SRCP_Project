import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, LayoutTemplate, MapPin, Award, Maximize2 } from 'lucide-react';
import Button from '../common/Button';

const TeamCard = ({ team, onAction, actionLabel, showStatus, onReject, onCancelInvite }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        // If the user role is FACULTY (or we can just blindly route to /faculty/team/:id since only faculty use this card in this context,
        // Wait, is TeamCard used by Students too? "GuideDashboard.jsx" uses it. Let's check.)
        // It's safer to just navigate to a route. Let's use /faculty/team/:id for now.
        // Actually, if we look at GuideDashboard.jsx, it's shared. Let's use a generic /team/ route or just /faculty/team/:id if that's what we built.
        // I will just route to /faculty/team/:id for now, and if they aren't faculty it might redirect, but usually TeamCard with details is viewed by faculty.
        navigate(`/faculty/team/${team.id}`, { state: { team } });
    };

    return (
        <>
            <div 
                onClick={handleCardClick}
                className="bg-surface/50 border border-border p-6 rounded-2xl hover:border-accent/50 cursor-pointer transition-all hover:shadow-lg relative group"
            >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex justify-between items-start mb-4 gap-3 sm:gap-4 pr-8">
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] sm:text-xs font-semibold text-accent/80 bg-accent/10 px-2 py-1 rounded-md mb-2 inline-block truncate max-w-full">
                            {team.domain}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-text-primary break-words leading-tight">{team.name}</h3>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1">ID: {team.id}</p>
                    </div>
                    {showStatus && (() => {
                        let displayStatus = team.status;
                        if (team.status === 'REQUESTED_GUIDE' && !team.guideId) {
                            displayStatus = 'FINALIZED';
                        }
                        
                        return (
                            <span className={`text-[10px] sm:text-xs shrink-0 text-center font-semibold px-2 py-1 rounded-md ${
                                displayStatus === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                displayStatus === 'REQUESTED_GUIDE' ? 'bg-yellow-500/10 text-yellow-500' :
                                displayStatus === 'FINALIZED' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-gray-500/10 text-gray-400'
                            }`}>
                                {displayStatus.replace('_', ' ')}
                            </span>
                        );
                    })()}
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-text-primary">Project Description</p>
                            <p className="text-sm text-text-secondary line-clamp-2">{team.description}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent flex-shrink-0" />
                        <p className="text-sm text-text-secondary">
                            Members: {team.members?.filter(m => m.inviteStatus !== 'REJECTED').length || 0}
                        </p>
                    </div>

                    {team.abstractFile && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50" onClick={e => e.stopPropagation()}>
                            <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                            <a 
                                href={`${import.meta.env.VITE_API_URL}/uploads/${team.abstractFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent hover:underline font-medium"
                            >
                                View Project Abstract
                            </a>
                        </div>
                    )}

                    {team.guide && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-accent/5 to-transparent border border-accent/20 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent/10 p-2 rounded-lg shrink-0">
                                    <Award className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">Assigned Guide</p>
                                    <p className="text-sm font-bold text-text-primary break-words leading-tight">{team.guide.fullName}</p>
                                </div>
                            </div>
                            {team.selectionSource && (
                                <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md shrink-0 text-center mx-auto sm:m-0 ${
                                    team.selectionSource === 'FACULTY' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                }`}>
                                    {team.selectionSource === 'FACULTY' ? 'Selected by Guide' : 'Selected by Student'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {team.members && team.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Team Members</p>
                        <ul className="space-y-1">
                            {team.members.filter(m => m.inviteStatus !== 'REJECTED').map((member) => (
                                <li key={member.id} className="text-sm text-text-primary flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                                    <div className="flex flex-col">
                                        <span>{member.user?.fullName || 'Student'} {member.isLeader ? '👑' : ''}</span>
                                        {member.user?.registerNumber && (
                                            <span className="text-xs text-text-secondary">{member.user.registerNumber}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                            member.inviteStatus === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' :
                                            member.inviteStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {member.inviteStatus}
                                        </span>
                                        {member.inviteStatus === 'PENDING' && onCancelInvite && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCancelInvite(member.userId); }}
                                                className="text-xs text-red-500 hover:text-red-400 font-medium px-2 py-0.5 rounded hover:bg-red-500/10 border border-red-500/20 transition-colors"
                                                title="Cancel invitation"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {(actionLabel || onReject) && (
                     <div className="mt-6 flex gap-3" onClick={e => e.stopPropagation()}>
                         {actionLabel && (
                             <Button onClick={() => onAction(team)} className="flex-1">
                                 {actionLabel}
                             </Button>
                         )}
                         {onReject && (
                             <Button onClick={() => onReject(team)} variant="outline" className="flex-1 text-red-400 hover:bg-red-400/10">
                                 Reject
                             </Button>
                         )}
                     </div>
                )}
            </div>

        </>
    );
};

export default TeamCard;
