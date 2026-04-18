import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Users, Building, BookOpen, ArrowRight, Search } from 'lucide-react';

const FacultyDirectory = () => {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const token = localStorage.getItem('sarc_token');
                const res = await fetch('http://localhost:5000/api/users/faculty', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFaculty(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, []);

    const filteredFaculty = faculty.filter(prof => {
        const term = searchTerm.toLowerCase();
        return prof.fullName.toLowerCase().includes(term) ||
            (prof.department && prof.department.toLowerCase().includes(term)) ||
            (prof.designation && prof.designation.toLowerCase().includes(term)) ||
            (prof.researchAreas && prof.researchAreas.some(area => area.toLowerCase().includes(term))) ||
            (prof.projects && prof.projects.some(project => project.title.toLowerCase().includes(term)));
    });

    return (
        <DashboardLayout>
            <div className="mb-8 border-b border-primary/10 pb-6">
                <Badge text="Directory" />
                <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Faculty & Researchers</h1>
                <p className="text-slate-600 mt-2 text-lg">Discover faculty profiles, read about their research, and explore the projects they are leading.</p>
            </div>

            <Card className="mb-8 p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, department, research area, or project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                    />
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-10">Loading faculty directory...</div>
            ) : filteredFaculty.length === 0 ? (
                <Card className="text-center py-16 flex flex-col items-center">
                    <Users size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No Faculty Found</h3>
                    <p className="text-slate-500 mt-2">No faculty members matched your search criteria.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFaculty.map((prof) => (
                        <Card key={prof.id} className="flex flex-col h-full hover:-translate-y-1 hover:shadow-xl transition-all border-t-4 border-t-secondary cursor-pointer bg-white" onClick={() => navigate(`/student/directory/${prof.id}`)}>
                            <div className="flex items-start gap-4 mb-4">
                                <img src={prof.profilePhoto ? `http://localhost:5000/uploads/${prof.profilePhoto}` : `https://ui-avatars.com/api/?name=${prof.fullName}&background=random`} alt={prof.fullName} className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover bg-slate-100" />
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{prof.fullName}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{prof.designation || 'Faculty Member'}</p>
                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Building size={12} className="flex-shrink-0"/> <span className="line-clamp-1">{prof.department}</span></p>
                                </div>
                            </div>
                            
                            <div className="flex-grow">
                                {prof.researchAreas && prof.researchAreas.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Research Areas</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {prof.researchAreas.slice(0, 3).map(area => (
                                                <span key={area} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 line-clamp-1">{area}</span>
                                            ))}
                                            {prof.researchAreas.length > 3 && <span className="px-1.5 py-0.5 bg-transparent text-slate-400 text-[10px] uppercase font-bold tracking-widest">+{prof.researchAreas.length - 3} More</span>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-secondary-dark font-bold text-sm">
                                    <BookOpen size={16}/> {prof.projects?.length || 0} Open Projects
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 p-0 group">
                                    View Profile <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform"/>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDirectory;
