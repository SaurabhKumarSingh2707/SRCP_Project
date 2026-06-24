import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '../../components/common/Button';

const GuideTeamCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        projectTitle: '',
        description: '',
        domain: '',
        customDomain: '',
        inviteMember: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { data: systemConfig, isLoading: configLoading } = useQuery({
        queryKey: ['systemConfig'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/system/config`);
            if (!res.ok) throw new Error('Failed to fetch config');
            return res.json();
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 100) {
            setError('Project description cannot exceed 100 words.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('sarc_token');

            const submitData = {
                projectTitle: formData.projectTitle,
                description: formData.description,
                domain: formData.domain === 'Other' ? formData.customDomain : formData.domain
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create team');
            }

            const teamData = await res.json();

            if (formData.inviteMember) {
                const inviteRes = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/teams/invite`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        teamId: teamData.id,
                        registerNumberOrEmail: formData.inviteMember
                    })
                });

                if (!inviteRes.ok) {
                    const inviteData = await inviteRes.json();
                    console.error('Failed to invite member:', inviteData.message);
                    alert(`Team created successfully, but failed to invite member: ${inviteData.message}`);
                }
            }

            navigate('/guide/team/my');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-text-primary mb-2">My project team</h1>
            <p className="text-text-secondary mb-8">Register your team for the final year project guide selection process.</p>

            {configLoading ? (
                <div className="text-slate-500">Loading configuration...</div>
            ) : systemConfig && systemConfig.isTeamCreationEnabled === false ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 p-6 rounded-2xl mb-6">
                    <h2 className="text-xl font-bold mb-2">Team Creation Closed</h2>
                    <p>The administration has disabled the creation of new project teams for this phase. Please contact your coordinator if you believe this is an error or if you need to be manually assigned to a team.</p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-surface/50 p-6 md:p-8 rounded-2xl border border-border">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Project Title</label>
                    <input 
                        type="text" 
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="e.g., Smart Attendance System"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Project Description</label>
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={`w-full bg-canvas border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all min-h-[120px] ${
                            formData.description.trim().split(/\s+/).filter(Boolean).length > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border'
                        }`}
                        placeholder="Briefly describe what your project does..."
                        required
                    />
                    {(() => {
                        const wordCount = formData.description.trim().split(/\s+/).filter(Boolean).length;
                        return (
                            <p className={`text-xs mt-1 text-right ${wordCount > 100 ? 'text-red-500 font-semibold' : 'text-text-secondary'}`}>
                                {wordCount} / 100 words
                            </p>
                        );
                    })()}
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Domain</label>
                    <select 
                        name="domain"
                        value={formData.domain}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        required
                    >
                        <option value="">Select Domain...</option>
                        <option value="AI/ML">AI / Machine Learning</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile Development">Mobile App Development</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="IoT">Internet of Things (IoT)</option>
                        <option value="Blockchain">Blockchain</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {formData.domain === 'Other' && (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Custom Domain Name</label>
                        <input 
                            type="text" 
                            name="customDomain"
                            value={formData.customDomain}
                            onChange={handleChange}
                            className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                            placeholder="Enter your domain name"
                            required
                        />
                    </div>
                )}

                <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-text-primary mb-2">Invite Team Member (Optional)</label>
                    <p className="text-xs text-text-secondary mb-2">Enter the email or register number of your partner to invite them.</p>
                    <input 
                        type="text" 
                        name="inviteMember"
                        value={formData.inviteMember}
                        onChange={handleChange}
                        className="w-full bg-canvas border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        placeholder="Email or Register Number"
                    />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Team'}
                    </Button>
                </div>
            </form>
                </>
            )}
        </div>
    );
};

export default GuideTeamCreate;
