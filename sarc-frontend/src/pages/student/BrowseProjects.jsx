import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Search, Filter, Calendar, Users, ArrowRight, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    let daysRemaining = null;
    if (project.deadline) {
        const deadlineDate = new Date(project.deadline);
        const diffTime = deadlineDate - new Date();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const defaultProfilePhoto = "https://ui-avatars.com/api/?name=Prof&background=random";

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                    <img
                        src={project.faculty?.profilePhoto ? `http://localhost:5000/uploads/${project.faculty.profilePhoto}` : defaultProfilePhoto}
                        className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover"
                        alt="Faculty"
                    />
                    <div>
                        <h3 className="text-lg font-bold font-heading text-slate-900 mb-0.5 line-clamp-1">{project.title}</h3>
                        <Link to={`/student/directory/${project.facultyId}`} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium hover:text-primary transition-colors cursor-pointer">
                            <User size={12} /> {project.faculty?.fullName || 'Prof'}
                        </Link>
                    </div>
                </div>
                <Badge color={project.status === 'OPEN' ? 'green' : project.status === 'COMPLETED' ? 'gray' : 'blue'}>
                    {project.status}
                </Badge>
            </div>

            {project.domain && (
                <div className="mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Domain:</span>
                    <span className="ml-2 text-sm font-medium text-slate-700">{project.domain}</span>
                </div>
            )}

            <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-grow">
                {project.description}
            </p>

            <div className="mb-6">
                <p className="text-xs font-bold font-heading text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                    {project.skillsRequired && project.skillsRequired.length > 0 ? (
                        project.skillsRequired.slice(0, 3).map((skill, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-primary-dark">
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-slate-400 italic">No specific skills listed</span>
                    )}
                    {project.skillsRequired && project.skillsRequired.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            +{project.skillsRequired.length - 3}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium whitespace-nowrap">
                    <Calendar size={14} className={daysRemaining && daysRemaining <= 7 ? "text-amber-500" : ""} />
                    <span className={daysRemaining && daysRemaining <= 7 ? "text-amber-600 font-bold" : ""}>
                        {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} days left` : 'Closed') : 'Open'}
                    </span>
                </div>
                <Link to={`/project/${project.id}`}>
                    <Button variant="primary" size="sm" className="gap-2 group py-1.5 px-3">
                        Details
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

const BrowseProjects = () => {
    const [projects, setProjects] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('projects');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const pRes = await fetch('http://localhost:5000/api/projects');
            const pData = await pRes.json();
            if (pRes.ok) setProjects(pData);

            const iRes = await fetch('http://localhost:5000/api/projects/ideas');
            const iData = await iRes.json();
            if (iRes.ok) setIdeas(iData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const term = searchTerm.toLowerCase();
        return project.title.toLowerCase().includes(term) ||
            project.description.toLowerCase().includes(term) ||
            (project.domain && project.domain.toLowerCase().includes(term)) ||
            (project.faculty && project.faculty.fullName?.toLowerCase().includes(term));
    });

    const filteredIdeas = ideas.filter(idea => {
        const term = searchTerm.toLowerCase();
        return idea.title.toLowerCase().includes(term) ||
            idea.description.toLowerCase().includes(term) ||
            (idea.faculty && idea.faculty.fullName?.toLowerCase().includes(term));
    });

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold font-heading text-slate-900">Browse Opportunities</h1>
                <p className="text-slate-600 mt-2 text-lg">Discover and apply for active research projects or explore ideas presented by faculty.</p>
            </div>

            <Card className="mb-8 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50">
                        <button
                            className={`px-4 py-2 font-bold text-sm rounded-md transition-colors ${activeTab === 'projects' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('projects')}
                        >
                            Active Projects
                        </button>
                        <button
                            className={`px-4 py-2 font-bold text-sm rounded-md transition-colors ${activeTab === 'ideas' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('ideas')}
                        >
                            Project Ideas
                        </button>
                    </div>
                </div>
                <div className="mt-4 relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title, domain, description, or faculty name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                    />
                </div>
            </Card>

            {loading ? (
                <div className="py-20 text-center text-slate-500 font-medium">Loading available opportunities...</div>
            ) : activeTab === 'projects' ? (
                filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => <ProjectCard key={project.id} project={project} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Users size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No projects found</h3>
                    </div>
                )
            ) : (
                filteredIdeas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIdeas.map(idea => (
                            <Card key={idea.id} className="flex flex-col h-full hover:shadow-lg transition-shadow border-l-4 border-l-amber-400">
                                <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">{idea.title}</h3>
                                <Link to={`/student/directory/${idea.facultyId}`} className="text-sm font-medium text-slate-500 mb-2 hover:text-primary transition-colors cursor-pointer inline-block">By Dr. {idea.faculty?.fullName}</Link>
                                <Badge color="yellow" className="self-start mb-4">{idea.difficultyLevel} Level</Badge>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-4">{idea.description}</p>
                                {idea.supportingFile && (
                                    <div className="mt-auto">
                                        <a href={`http://localhost:5000/uploads/${idea.supportingFile}`} download target="_blank" rel="noreferrer" className="text-primary text-sm font-bold hover:underline">Download Supporting File</a>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No ideas found</h3>
                    </div>
                )
            )}
        </DashboardLayout>
    );
};

export default BrowseProjects;
