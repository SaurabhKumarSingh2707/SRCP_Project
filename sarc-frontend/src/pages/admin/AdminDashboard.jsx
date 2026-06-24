import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, StatWidget } from '../../components/widgets/DashboardWidgets';
import { Users, BookOpen, Activity, AlertTriangle, ArrowRight, Search } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
    const { data: analytics, isLoading: loading } = useQuery({
        queryKey: ['adminAnalytics'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/analytics`, {
                // Cookies handle auth now
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch analytics');
            return res.json();
        },
        staleTime: 15 * 1000 // Cache for 15 seconds
    });

    const fetchedAt = React.useMemo(() => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [analytics]);

    const { stats, departmentData, participationData, recentFlags } = analytics || {};

    const participationPercentage = participationData?.length > 0 && participationData[0].name === 'Active Students' 
        ? Math.round((participationData[0].value / Math.max(1, participationData[0].value + (participationData[1]?.value || 0))) * 100) 
        : 0;

    const downloadCSV = () => {
        if (!departmentData || departmentData.length === 0) return;
        const headers = ["Department", "Active Projects"];
        const rows = departmentData.map(d => `"${d.name}",${d.projects}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "department_research_activity.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-primary/10 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Platform Analytics Overview</h1>
                    <p className="text-slate-600 mt-2 text-lg">Monitor system health, usage statistics, and Sathyabama research activity.</p>
                </div>
                <div className="mt-4 sm:mt-0 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    Last updated: Today, {fetchedAt}
                </div>
            </div>

            {(loading || !analytics) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading analytics data...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatWidget title="Total Users" value={stats.totalUsers} icon={Users} trend={0} />
                        <StatWidget title="Active Projects" value={stats.activeProjects} icon={BookOpen} trend={0} />
                        <StatWidget title="Success Rate" value={stats.successRate} icon={Activity} trend={0} />
                        <StatWidget title="System Alerts" value={stats.systemAlerts} icon={AlertTriangle} trend={0} />
                    </div>


            {/* Single Member Teams Section */}
            <SingleMemberTeamsTable />

            {/* Unassigned Students Section */}
            <UnassignedStudentsTable />

        </>
            )}
        </>
    );
};

const UnassignedStudentsTable = () => {
    const [page, setPage] = useState(1);
    
    const { data, isLoading } = useQuery({
        queryKey: ['unassignedStudents', page],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/unassigned-students?page=${page}&limit=10`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch unassigned students');
            return res.json();
        },
        keepPreviousData: true
    });

    const downloadUnassignedCSV = async () => {
        try {
            // Fetch all for CSV
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/unassigned-students?limit=5000`, {
                credentials: 'include'
            });
            const fullData = await res.json();
            const headers = ["Name", "Register Number", "Email", "Department"];
            const rows = fullData.students.map(s => 
                `"${s.fullName}","${s.registerNumber || ''}","${s.email}","${s.studentProfile?.department || ''}"`
            );
            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "unassigned_students.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading CSV", error);
        }
    };

    return (
        <Card className="shadow-sm border-t-4 border-t-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-heading text-slate-800">Unassigned Students</h2>
                <div className="flex items-center gap-4">
                    {data?.total > 0 && (
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{data.total} Students Without Teams</span>
                    )}
                    <button onClick={downloadUnassignedCSV} className="text-sm font-bold text-primary hover:underline">Download CSV</button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-10 text-center text-slate-500">Loading students...</div>
            ) : data?.students?.length > 0 ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-canvas border-b border-slate-200">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Register Number</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Email</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Department</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 pb-2">
                                {data?.students?.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-sm font-bold text-slate-800">{student.fullName}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600 font-medium">{student.registerNumber || '-'}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600">{student.email}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600 text-right">{student.studentProfile?.department || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold text-slate-500">
                                Page {page} of {data.totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="py-10 text-center text-slate-500 font-medium">
                    All students have been assigned to a team!
                </div>
            )}
        </Card>
    );
};

const SearchableStudentSelect = ({ students, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = students.filter(s => 
        s.fullName.toLowerCase().includes(search.toLowerCase()) || 
        (s.registerNumber && s.registerNumber.toLowerCase().includes(search.toLowerCase()))
    );

    const displayStudents = filtered.slice(0, 50);

    const selectedStudent = students.find(s => s.id === value);

    return (
        <div ref={wrapperRef} className="relative w-full min-w-[300px] max-w-[400px] text-left">
            <div 
                className="flex items-center justify-between px-3 py-1.5 border border-slate-300 rounded-md text-sm cursor-pointer bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate text-slate-700">{selectedStudent ? `${selectedStudent.fullName} (${selectedStudent.registerNumber})` : 'Select Unassigned Student'}</span>
                <span className="ml-2 text-slate-400 text-xs">▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-96 flex flex-col">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                        <input 
                            type="text" 
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-primary"
                            placeholder="Search student..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto">
                        {displayStudents.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">No students found</div>
                        ) : (
                            <>
                                {displayStudents.map(s => (
                                    <div 
                                        key={s.id}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${value === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-slate-700'}`}
                                        onClick={() => {
                                            onChange(s.id);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        {s.fullName} ({s.registerNumber})
                                    </div>
                                ))}
                                {filtered.length > 50 && (
                                    <div className="px-3 py-2 text-xs text-slate-400 text-center border-t border-slate-100 bg-slate-50">
                                        Type to search for {filtered.length - 50} more students...
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SingleMemberTeamsTable = () => {
    const queryClient = useQueryClient();
    const [selectedStudent, setSelectedStudent] = useState({});
    const [assigning, setAssigning] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all teams to filter single-member teams
    const { data: teams = [], isLoading: loadingTeams } = useQuery({
        queryKey: ['adminTeams'],
        queryFn: async () => {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch teams');
            return res.json();
        }
    });

    // Fetch unassigned students for the dropdown
    const { data: unassignedData, isLoading: loadingStudents } = useQuery({
        queryKey: ['unassignedStudentsList'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/unassigned-students?limit=5000`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch unassigned students');
            return res.json();
        }
    });

    const singleMemberTeams = teams.filter(team => 
        team.members.filter(m => m.inviteStatus === 'ACCEPTED').length === 1
    );

    const filteredTeams = singleMemberTeams.filter(team => 
        team.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const unassignedStudents = unassignedData?.students || [];

    const handleAssign = async (teamId) => {
        const studentId = selectedStudent[teamId];
        if (!studentId) {
            alert('Please select a student to assign');
            return;
        }

        if (!window.confirm('Are you sure you want to forcibly assign this student to the team?')) return;

        setAssigning(teamId);
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/guide/admin/teams/${teamId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ studentId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to assign student');
            }

            alert('Student assigned successfully!');
            // Invalidate to refresh the single member teams list and unassigned students table below
            queryClient.invalidateQueries(['adminTeams']);
            queryClient.invalidateQueries(['unassignedStudentsList']);
            queryClient.invalidateQueries(['unassignedStudents']);
        } catch (error) {
            alert(error.message);
        } finally {
            setAssigning(null);
        }
    };

    if (loadingTeams || loadingStudents) {
        return <div className="py-4 text-center text-slate-500">Loading Single Member Teams...</div>;
    }

    if (singleMemberTeams.length === 0) {
        return null; // Hide if no single member teams
    }

    return (
        <Card className="shadow-sm border-t-4 border-t-orange-500 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={20} />
                    Single Member Teams
                </h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by Team ID or Name..." 
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{singleMemberTeams.length} Teams Need Partners</span>
                </div>
            </div>
            <div className="overflow-visible w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-orange-50/50 border-b border-orange-100">
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Team Details</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Current Member</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Assign Partner</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 pb-2">
                        {filteredTeams?.map(team => {
                            const leader = team.members.find(m => m.inviteStatus === 'ACCEPTED')?.user;
                            return (
                                <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-bold text-slate-800">{team.name} <span className="text-xs font-normal text-slate-400 font-mono ml-2">ID: {team.id}</span></div>
                                        <div className="text-xs text-slate-500">{team.domain}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-slate-700">{leader?.fullName}</div>
                                        <div className="text-xs text-slate-500">{leader?.registerNumber || leader?.email}</div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <SearchableStudentSelect 
                                                students={unassignedStudents}
                                                value={selectedStudent[team.id] || ''}
                                                onChange={(val) => setSelectedStudent({ ...selectedStudent, [team.id]: val })}
                                            />
                                            <button 
                                                onClick={() => handleAssign(team.id)}
                                                disabled={assigning === team.id || !selectedStudent[team.id]}
                                                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                                            >
                                                {assigning === team.id ? 'Assigning...' : 'Assign'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AdminDashboard;
