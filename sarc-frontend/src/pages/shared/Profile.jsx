import React, { useState, useEffect } from 'react';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { User, Mail, Building, FileText, Save, CheckCircle } from 'lucide-react';

const Profile = () => {
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        role: '',
        department: '',
        bio: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setProfileData({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    role: data.role || '',
                    department: data.department || '',
                    bio: data.bio || ''
                });
            }
        } catch (error) {
            console.error("Error fetching profile", error);
            setErrorMsg("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const token = localStorage.getItem('sarc_token');
            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Only send editable fields
                body: JSON.stringify({
                    fullName: profileData.fullName,
                    department: profileData.department,
                    bio: profileData.bio
                })
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMsg("Profile updated successfully!");
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg(data.message || "Failed to update profile");
            }
        } catch (error) {
            setErrorMsg("Could not connect to server");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold font-heading text-slate-900">My Profile</h1>
                <p className="text-slate-600">Update your personal information and biography.</p>
            </div>

            <Card className="p-6">
                {successMsg && (
                    <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-200">
                        <CheckCircle size={20} />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex flex-col gap-1 border border-red-200">
                        <span className="font-medium text-sm">{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Read Only)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={profileData.email}
                                    disabled
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">System Role (Read Only)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={profileData.role}
                                    disabled
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        {/* Editable fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={profileData.fullName}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department / Institution</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="department"
                                        value={profileData.department}
                                        onChange={handleChange}
                                        placeholder="e.g. Computer Science and Engineering"
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Biography</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <FileText className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <textarea
                                        name="bio"
                                        value={profileData.bio}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Tell us about your research interests and background..."
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <Button type="submit" disabled={saving} className="flex items-center gap-2">
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
