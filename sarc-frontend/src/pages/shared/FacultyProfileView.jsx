import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Building, BookOpen, ArrowLeft, Lightbulb, GraduationCap } from 'lucide-react';

const FacultyProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prof, setProf] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch(`http://localhost:5000/api/users/faculty/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProf(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, [id]);

    if (loading) return <DashboardLayout><div className="text-center py-10">Loading profile...</div></DashboardLayout>;
    if (!prof) return <DashboardLayout><div className="text-center py-10 text-xl font-bold">Faculty Profile Not Found</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="mb-6">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent text-slate-400 hover:text-slate-600 mb-2" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16}/> Back
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Widget */}
                <div className="lg:col-span-1">
                    <Card className="text-center pt-10 pb-8 flex flex-col items-center shadow-lg border-t-8 border-t-secondary relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/5 to-secondary/10 z-0"></div>
                        <img 
                            src={prof.profilePhoto ? `http://localhost:5000/uploads/${prof.profilePhoto}` : `https://ui-avatars.com/api/?name=${prof.fullName}&background=random`} 
                            alt={prof.fullName} 
                            className="w-32 h-32 rounded-full border-4 border-white shadow-md z-10 bg-white object-cover mb-4" 
                        />
                        <h1 className="text-2xl font-extrabold font-heading text-slate-900 z-10">{prof.fullName}</h1>
                        <p className="text-primary font-bold z-10">{prof.designation || 'Faculty Member'}</p>
                        
                        <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 font-medium text-sm">
                            <Building size={16} className="text-slate-400"/>
                            {prof.department || 'Interdisciplinary Sciences'}
                        </div>

                        {/* NO PERSONAL DETAILS SHOWN (contactNumber, email, linkedin omitted) based on user requirements */}
                    </Card>

                    <Card className="mt-6 border-l-4 border-l-primary shadow-sm">
                        <h3 className="text-lg font-bold font-heading text-slate-800 flex items-center gap-2 mb-4"><Lightbulb size={18} className="text-primary"/> Research Areas</h3>
                        {prof.researchAreas && prof.researchAreas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {prof.researchAreas.map(area => (
                                    <span key={area} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">{area}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Core research domains are currently being updated.</p>
                        )}
                    </Card>

                    {prof.skills && prof.skills.length > 0 && (
                        <Card className="mt-6 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {prof.skills.map(skill => (
                                    <Badge key={skill} color="blue">{skill}</Badge>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <GraduationCap size={120} />
                        </div>
                        <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-3 mb-4 relative z-10">
                            <GraduationCap size={20} className="text-secondary" /> About {prof.fullName}
                        </h2>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line relative z-10">
                            {prof.bio || `Dr. ${prof.fullName} is a dedicated faculty member deeply involved in guiding student research and driving innovation. They are currently leading multiple academic initiatives and actively seeking impassioned students to collaborate on upcoming projects.`}
                        </p>
                    </Card>

                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800 flex items-center gap-3 mb-6">
                            <BookOpen size={24} className="text-primary" /> Active Research Projects
                        </h2>
                        
                        {prof.projects && prof.projects.length > 0 ? (
                            <div className="space-y-4">
                                {prof.projects.map(proj => (
                                    <Card key={proj.id} className="border border-slate-100 hover:border-primary/30 transition-colors shadow-sm cursor-pointer" onClick={() => navigate(`/project/${proj.id}`)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{proj.title}</h3>
                                            <Badge color={proj.status === 'OPEN' ? 'green' : 'yellow'}>{proj.status}</Badge>
                                        </div>
                                        {proj.domain && <p className="text-sm font-medium text-slate-500 mb-3">{proj.domain}</p>}
                                        <p className="text-slate-600 text-sm line-clamp-2">{proj.description}</p>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-10 bg-slate-50/50 border-dashed border-2 border-slate-200">
                                <p className="text-slate-500 font-medium">This faculty member does not have any active projects open for application right now.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FacultyProfileView;
