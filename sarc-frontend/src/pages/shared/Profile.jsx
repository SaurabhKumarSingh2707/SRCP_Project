import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { User, Mail, Building, FileText, Save, CheckCircle, Camera, Link as LinkIcon, Phone, Plus, Trash2 } from 'lucide-react';

const Profile = () => {
    const defaultProfilePhoto = "https://ui-avatars.com/api/?name=User&background=random";
    const userRole = localStorage.getItem('sarc_role');

    const [profileData, setProfileData] = useState({
        fullName: '', email: '', role: '', department: '', bio: '',
        // Student
        studentId: '', yearOfStudy: '', skills: '', programmingLanguages: '', projectsCompleted: '', githubLink: '', areasOfInterest: '',
        // Faculty
        facultyId: '', designation: '', researchAreas: '', yearsOfExperience: '', contactNumber: '', linkedin: '', pastProjects: [],
        profilePhoto: ''
    });

    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
    const [resumeFile, setResumeFile] = useState(null);

    const fileInputRef = useRef(null);
    const resumeInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('sarc_token');
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const profileObj = data.role === 'STUDENT' ? (data.studentProfile || {}) : (data.role === 'FACULTY' ? (data.facultyProfile || {}) : {});

                setProfileData({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    role: data.role || '',
                    department: profileObj.department || '',
                    bio: profileObj.bio || '',
                    studentId: profileObj.studentId || '',
                    yearOfStudy: profileObj.yearOfStudy || '',
                    skills: profileObj.skills ? profileObj.skills.join(', ') : '',
                    programmingLanguages: profileObj.programmingLanguages ? profileObj.programmingLanguages.join(', ') : '',
                    projectsCompleted: profileObj.projectsCompleted || '',
                    githubLink: profileObj.githubLink || '',
                    areasOfInterest: profileObj.areasOfInterest ? profileObj.areasOfInterest.join(', ') : '',
                    facultyId: profileObj.facultyId || '',
                    designation: profileObj.designation || '',
                    researchAreas: profileObj.researchAreas ? profileObj.researchAreas.join(', ') : '',
                    yearsOfExperience: profileObj.yearsOfExperience || '',
                    contactNumber: profileObj.contactNumber || '',
                    linkedin: profileObj.linkedin || '',
                    pastProjects: profileObj.pastProjects ? profileObj.pastProjects.map(p => { try { return typeof p === 'string' ? JSON.parse(p) : p; } catch (e) { return { title: p, description: '', domain: '', year: '', fundingAgency: '', link: '' } } }) : [],
                    profilePhoto: data.profilePhoto || ''
                });
                if (data.profilePhoto) {
                    setProfilePhotoPreview(`http://localhost:5000/uploads/${data.profilePhoto}`);
                }
            }
        } catch (error) {
            setErrorMsg("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

    const handlePastProjectChange = (index, field, value) => {
        const newProjects = [...profileData.pastProjects];
        newProjects[index][field] = value;
        setProfileData({ ...profileData, pastProjects: newProjects });
    };
    const addPastProject = () => setProfileData({ ...profileData, pastProjects: [...profileData.pastProjects, { title: '', description: '', domain: '', year: '', fundingAgency: '', link: '' }] });
    const removePastProject = (index) => setProfileData({ ...profileData, pastProjects: profileData.pastProjects.filter((_, i) => i !== index) });

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePhotoFile(file);
            setProfilePhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleResumeChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg(''); setSuccessMsg('');

        try {
            const token = localStorage.getItem('sarc_token');
            const formData = new FormData();

            // Append all text data
            Object.keys(profileData).forEach(key => {
                if (key === 'pastProjects') {
                    formData.append('pastProjects', JSON.stringify(profileData.pastProjects));
                } else if (key !== 'profilePhoto' && profileData[key] !== null && profileData[key] !== undefined) {
                    formData.append(key, profileData[key]);
                }
            });

            // Append files
            if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
            if (resumeFile) formData.append('resumeFile', resumeFile);

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMsg("Profile updated successfully!");
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

    const isStudent = profileData.role === 'STUDENT';
    const isFaculty = profileData.role === 'FACULTY';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900">My Profile</h1>
                    <p className="text-slate-600">Update your personal information, photo, and details.</p>
                </div>
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

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Top Section: Photo & Basic Details */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Photo Upload */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-100">
                                <img
                                    src={profilePhotoPreview || defaultProfilePhoto}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                                >
                                    <Camera size={24} />
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handlePhotoChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="text-sm text-primary hover:text-primary/80 font-medium"
                            >
                                Change Photo
                            </button>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                                    <input type="text" name="fullName" value={profileData.fullName} onChange={handleChange} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                                    <input type="text" value={profileData.email} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building className="h-5 w-5 text-slate-400" /></div>
                                    <input type="text" name="department" value={profileData.department} onChange={handleChange} placeholder="e.g. Computer Science" className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">System Role (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                                    <input type="text" value={profileData.role} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Role Specific Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isStudent && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Student ID / Roll No</label><input type="text" name="studentId" value={profileData.studentId} onChange={handleChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Year of Study</label><input type="text" name="yearOfStudy" value={profileData.yearOfStudy} onChange={handleChange} placeholder="e.g. 3rd Year" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma separated)</label><input type="text" name="skills" value={profileData.skills} onChange={handleChange} placeholder="e.g. Graphic Design, Figma" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Programming Languages (comma separated)</label><input type="text" name="programmingLanguages" value={profileData.programmingLanguages} onChange={handleChange} placeholder="e.g. Python, JS, C++" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Projects Completed</label><input type="number" name="projectsCompleted" value={profileData.projectsCompleted} onChange={handleChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Areas of Interest (comma separated)</label><input type="text" name="areasOfInterest" value={profileData.areasOfInterest} onChange={handleChange} placeholder="e.g. AI, Cybersec" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">GitHub / Portfolio Link</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-5 w-5 text-slate-400" /></div>
                                        <input type="text" name="githubLink" value={profileData.githubLink} onChange={handleChange} placeholder="https://github.com/..." className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Resume (PDF/DOC)</label>
                                    <input type="file" ref={resumeInputRef} onChange={handleResumeChange} accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border border-slate-300 rounded-lg" />
                                </div>
                            </>
                        )}

                        {isFaculty && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Faculty ID</label><input type="text" name="facultyId" value={profileData.facultyId} onChange={handleChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Designation</label><input type="text" name="designation" value={profileData.designation} onChange={handleChange} placeholder="e.g. Associate Professor" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label><input type="number" name="yearsOfExperience" value={profileData.yearsOfExperience} onChange={handleChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Research Areas / Specialization</label><input type="text" name="researchAreas" value={profileData.researchAreas} onChange={handleChange} placeholder="e.g. Machine Learning, IoT" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Skills / Technologies</label><input type="text" name="skills" value={profileData.skills} onChange={handleChange} placeholder="e.g. Cloud Computing" className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
                                        <input type="text" name="contactNumber" value={profileData.contactNumber} onChange={handleChange} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn / Personal Website</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon className="h-5 w-5 text-slate-400" /></div>
                                        <input type="text" name="linkedin" value={profileData.linkedin} onChange={handleChange} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg sm:text-sm" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {isFaculty && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-slate-900">Previous Projects</h3>
                                    <p className="text-sm text-slate-500">Detail the research projects you have previously worked on.</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addPastProject} className="gap-2">
                                    <Plus size={16} /> Add Project
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {profileData.pastProjects.map((project, index) => (
                                    <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                        <button type="button" onClick={() => removePastProject(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Title*</label>
                                                    <input type="text" value={project.title || ''} onChange={(e) => handlePastProjectChange(index, 'title', e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="e.g. AI for Healthcare" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Domain / Specialty</label>
                                                    <input type="text" value={project.domain || ''} onChange={(e) => handlePastProjectChange(index, 'domain', e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="e.g. Machine Learning, IoT" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration / Year</label>
                                                    <input type="text" value={project.year || ''} onChange={(e) => handlePastProjectChange(index, 'year', e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="e.g. 2023 - 2024" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Funding Agency (Optional)</label>
                                                    <input type="text" value={project.fundingAgency || ''} onChange={(e) => handlePastProjectChange(index, 'fundingAgency', e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="e.g. DST, Internal Grant" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Link (Optional)</label>
                                                    <input type="text" value={project.link || ''} onChange={(e) => handlePastProjectChange(index, 'link', e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="https://..." />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Details / Description*</label>
                                                    <textarea value={project.description || ''} onChange={(e) => handlePastProjectChange(index, 'description', e.target.value)} rows={3} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" placeholder="Summarize your role, the technologies used, and the impact..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {profileData.pastProjects.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                        No previous projects added. Click "Add Project" to include them.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bio Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio / About Section</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none"><FileText className="h-5 w-5 text-slate-400" /></div>
                            <textarea name="bio" value={profileData.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself..." className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <Button type="submit" disabled={saving} className="flex items-center gap-2">
                            {saving ? <>Saving...</> : <><Save size={18} /> Save Changes</>}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
