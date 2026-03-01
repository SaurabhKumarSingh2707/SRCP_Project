import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Badge } from '../../components/widgets/DashboardWidgets';
import Button from '../../components/common/Button';
import { Search, Filter, Calendar, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    // Determine days remaining if deadline exists
    let daysRemaining = null;
    if (project.deadline) {
        const deadlineDate = new Date(project.deadline);
        const today = new Date();
        const diffTime = deadlineDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold font-heading text-slate-900 mb-1">{project.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Prof. {project.faculty?.fullName || 'Unknown'}</span>
                        {project.faculty?.department && (
                            <>
                                <span>•</span>
                                <span>{project.faculty.department}</span>
                            </>
                        )}
                    </div>
                </div>
                <Badge color={project.status === 'OPEN' ? 'green' : 'gray'}>
                    {project.status}
                </Badge>
            </div>

            <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-grow">
                {project.description}
            </p>

            <div className="mb-6">
                <p className="text-xs font-bold font-heading text-slate-400 uppercase tracking-widest mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                    {project.skillsRequired && project.skillsRequired.length > 0 ? (
                        project.skillsRequired.map((skill, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/20 text-primary border border-secondary/30">
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-slate-400 italic">No specific skills listed</span>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calendar size={16} className={daysRemaining && daysRemaining <= 7 ? "text-amber-500" : ""} />
                    <span className={daysRemaining && daysRemaining <= 7 ? "text-amber-600 font-bold" : ""}>
                        {daysRemaining !== null ? (
                            daysRemaining > 0 ? `Closes in ${daysRemaining} days` : 'Closed'
                        ) : (
                            'Open until filled'
                        )}
                    </span>
                </div>

                <Link to={`/project/${project.id}`}>
                    <Button variant="primary" size="sm" className="gap-2 group">
                        View Details
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
};

const BrowseProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/projects');
            const data = await response.json();
            if (response.ok) {
                setProjects(data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.faculty && project.faculty.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold font-heading text-slate-900">Browse Projects</h1>
                <p className="text-slate-600 mt-2 text-lg">Discover and apply for active research opportunities at Sathyabama.</p>
            </div>

            {/* Search and Filter Bar */}
            <Card className="mb-8 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by project title, description, or faculty name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700"
                        />
                    </div>
                    <Button variant="outline" className="gap-2 whitespace-nowrap md:w-auto w-full justify-center">
                        <Filter size={18} />
                        Filter & Sort
                    </Button>
                </div>
            </Card>

            {/* Project Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-500 font-medium">
                    Loading available projects...
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No projects found</h3>
                    <p className="text-slate-500">We couldn't find any projects matching your search criteria.</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default BrowseProjects;
