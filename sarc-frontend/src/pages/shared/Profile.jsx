import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { User, Mail, Building, FileText, Save, CheckCircle, Camera, Link as LinkIcon, Phone, Plus, Trash2, X, Calendar, Hash, Users } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    await new Promise((resolve, reject) => { 
        image.onload = resolve; 
        image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
    });
};

const Profile = () => {
    const defaultProfilePhoto = "https://ui-avatars.com/api/?name=User&background=random";
    const userRole = localStorage.getItem('sarc_role');

    const [profileData, setProfileData] = useState({
        fullName: '', email: '', role: '', department: '', bio: '',
        // Student
        studentId: '', yearOfStudy: '', section: '', dateOfBirth: '', skills: '', programmingLanguages: '', projectsCompleted: '', githubLink: '', areasOfInterest: '',
        // Faculty
        employeeId: '', designation: '', researchAreas: '', yearsOfExperience: '', contactNumber: '', linkedin: '', pastProjects: [],
        profilePhoto: ''
    });

    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
    const [resumeFile, setResumeFile] = useState(null);

    // Image Cropper State
    const [showCropModal, setShowCropModal] = useState(false);
    const [tempImgSrc, setTempImgSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const onMediaLoaded = (mediaSize) => {
        // Automatically align the crop to the TOP of the image instead of center
        // In react-easy-crop, y > 0 translates the image DOWN, which moves the crop area UP.
        // To align crop area to absolute top, y should be (mediaSize.height - mediaSize.width)/2 if it's portrait.
        // Wait, react-easy-crop calculates based on aspect ratio constraints.
        // Actually, setting crop to { x: 0, y: Number.MAX_SAFE_INTEGER } will clamp it to the top!
        // But we can accurately calculate the max Y translation:
        // Max Y translation = (mediaSize.height * zoom - cropSize) / 2
        // Since zoom is 1 initially, and we assume portrait fits by width:
        const aspect = mediaSize.width / mediaSize.height;
        if (aspect < 1) { // Portrait
            // We want to shift the image DOWN by the maximum allowed to hit the top boundary
            setCrop({ x: 0, y: 10000 }); // It will automatically clamp to the top boundary
        }
    };

    const fileInputRef = useRef(null);
    const resumeInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();

    const { data: authData, isLoading: queryLoading, isError } = useQuery({
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

    useEffect(() => {
        if (authData) {
            const data = authData;
            const profileObj = data.role === 'STUDENT' ? (data.studentProfile || {}) : (data.role === 'FACULTY' ? (data.facultyProfile || {}) : {});

            setProfileData({
                fullName: data.fullName || '',
                email: data.email || '',
                role: data.role || '',
                department: profileObj.department || '',
                bio: profileObj.bio || '',
                studentId: data.registerNumber || '',
                yearOfStudy: profileObj.yearOfStudy || '',
                section: profileObj.section || '',
                dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
                skills: profileObj.skills ? profileObj.skills.join(', ') : '',
                programmingLanguages: profileObj.programmingLanguages ? profileObj.programmingLanguages.join(', ') : '',
                projectsCompleted: profileObj.projectsCompleted || '',
                githubLink: profileObj.githubLink || '',
                areasOfInterest: profileObj.areasOfInterest ? profileObj.areasOfInterest.join(', ') : '',
                employeeId: profileObj.employeeId || '',
                designation: profileObj.designation || '',
                researchAreas: profileObj.researchAreas ? profileObj.researchAreas.join(', ') : '',
                yearsOfExperience: profileObj.yearsOfExperience || '',
                contactNumber: profileObj.contactNumber || '',
                linkedin: profileObj.linkedin || '',
                pastProjects: profileObj.pastProjects ? profileObj.pastProjects.map(p => { try { return typeof p === 'string' ? JSON.parse(p) : p; } catch (e) { return { title: p, description: '', domain: '', year: '', fundingAgency: '', link: '' } } }) : [],
                profilePhoto: data.profilePhoto || ''
            });
            if (data.profilePhoto) {
                const isAbsolute = data.profilePhoto.startsWith('http');
                setProfilePhotoPreview(isAbsolute ? data.profilePhoto : `${import.meta.env.VITE_API_URL}/uploads/${data.profilePhoto.split(/[\\/]/).pop()}`);
            }
            setLoading(false);
        } else if (isError) {
            setErrorMsg("Failed to load profile data");
            setLoading(false);
        }
    }, [authData, isError]);

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
            setTempImgSrc(URL.createObjectURL(file));
            setShowCropModal(true);
            // Reset input so the same file can be selected again if cancelled
            e.target.value = '';
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

            let profilePhotoUrl = profileData.profilePhoto;
            let resumeFileUrl = undefined;

            if (profilePhotoFile) {
                profilePhotoUrl = await uploadToCloudinary(profilePhotoFile);
            }
            if (resumeFile) {
                resumeFileUrl = await uploadToCloudinary(resumeFile);
            }

            const submitData = {
                ...profileData,
                profilePhoto: profilePhotoUrl,
                resumeFile: resumeFileUrl
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();
            if (response.ok) {
                queryClient.invalidateQueries({ queryKey: ['authMe'] });
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

            {/* Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Crop Profile Photo</h3>
                            <button onClick={() => { setShowCropModal(false); setTempImgSrc(null); setZoom(1); setCrop({ x: 0, y: 0 }); }} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                            <div className="relative w-full h-[300px] bg-slate-100 rounded-lg overflow-hidden">
                                <Cropper
                                    image={tempImgSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    onMediaLoaded={onMediaLoaded}
                                />
                            </div>
                            <div className="w-full mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Zoom / Scale</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min="1"
                                    max="3"
                                    step="0.01"
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full accent-primary cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => { setShowCropModal(false); setTempImgSrc(null); setZoom(1); setCrop({ x: 0, y: 0 }); }}>Cancel</Button>
                            <Button variant="primary" onClick={async () => {
                                try {
                                    const croppedFile = await getCroppedImg(tempImgSrc, croppedAreaPixels);
                                    setProfilePhotoFile(croppedFile);
                                    setProfilePhotoPreview(URL.createObjectURL(croppedFile));
                                    setShowCropModal(false);
                                    setTempImgSrc(null);
                                    setZoom(1);
                                    setCrop({ x: 0, y: 0 });
                                } catch (e) {
                                    console.error("Failed to crop image", e);
                                }
                            }}>Crop & Save</Button>
                        </div>
                    </div>
                </div>
            )}

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
                        {/* Profile Photo */}
                        <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-100">
                                <img
                                    src={profilePhotoPreview || (isStudent ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || 'User')}&background=random&size=128` : defaultProfilePhoto)}
                                    alt="Profile"
                                    width="128"
                                    height="128"
                                    fetchPriority="high"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                />
                                {profilePhotoPreview && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempImgSrc(profilePhotoPreview);
                                            setCrop({ x: 0, y: 0 });
                                            setZoom(1);
                                            setShowCropModal(true);
                                        }}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        <Camera size={24} />
                                    </button>
                                )}
                            </div>
                            {profilePhotoPreview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempImgSrc(profilePhotoPreview);
                                        setCrop({ x: 0, y: 0 });
                                        setZoom(1);
                                        setShowCropModal(true);
                                    }}
                                    className="text-sm text-primary hover:text-primary/80 font-medium"
                                >
                                    Adjust Photo
                                </button>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                                    <input id="fullName" type="text" name="fullName" value={profileData.fullName} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                                    <input id="email" type="text" value={profileData.email} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">Department (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building className="h-5 w-5 text-slate-400" /></div>
                                    <input id="department" type="text" name="department" value={profileData.department} disabled placeholder="e.g. Computer Science" className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">System Role (Read Only)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                                    <input id="role" type="text" value={profileData.role} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Role Specific Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isStudent && (
                            <>
                                <div>
                                    <label htmlFor="studentId" className="block text-sm font-medium text-slate-700 mb-1">Register No (Read Only)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash className="h-5 w-5 text-slate-400" /></div>
                                        <input id="studentId" type="text" name="studentId" value={profileData.studentId} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="section" className="block text-sm font-medium text-slate-700 mb-1">Section (Read Only)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users className="h-5 w-5 text-slate-400" /></div>
                                        <input id="section" type="text" name="section" value={profileData.section} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-1">Date of Birth (Read Only)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-slate-400" /></div>
                                        <input id="dateOfBirth" type="date" name="dateOfBirth" value={profileData.dateOfBirth} disabled className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm cursor-not-allowed" />
                                    </div>
                                </div>
                            </>
                        )}

                        {isFaculty && (
                            <>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label><input type="text" name="employeeId" value={profileData.employeeId} onChange={handleChange} className="block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm" /></div>
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
                    {!isStudent && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio / About Section</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none"><FileText className="h-5 w-5 text-slate-400" /></div>
                                <textarea name="bio" value={profileData.bio} onChange={handleChange} rows={4} placeholder="Tell us about yourself..." className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                        </div>
                    )}

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
