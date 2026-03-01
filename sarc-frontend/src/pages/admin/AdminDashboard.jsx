import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, StatWidget } from '../../components/widgets/DashboardWidgets';
import { Users, BookOpen, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const departmentData = [
    { name: 'Computer Sci', projects: 45 },
    { name: 'Engineering', projects: 32 },
    { name: 'Biology', projects: 28 },
    { name: 'Physics', projects: 15 },
    { name: 'Business', projects: 12 },
];

const participationData = [
    { name: 'Active Students', value: 850, color: '#800000' }, // Primary Maroon
    { name: 'Inactive/Browsing', value: 350, color: '#FFD700' }, // Secondary Gold
];

const AdminDashboard = () => {
    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-primary/10 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold font-heading text-primary mt-2">Platform Analytics Overview</h1>
                    <p className="text-slate-600 mt-2 text-lg">Monitor system health, usage statistics, and Sathyabama research activity.</p>
                </div>
                <div className="mt-4 sm:mt-0 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    Last updated: Today, 09:42 AM
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatWidget title="Total Users" value="1,285" icon={Users} trend={12} />
                <StatWidget title="Active Projects" value="240" icon={BookOpen} trend={5} />
                <StatWidget title="Success Rate" value="88%" icon={Activity} trend={2} />
                <StatWidget title="System Alerts" value="3" icon={AlertTriangle} trend={-15} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Bar Chart - Department Activity */}
                <Card className="lg:col-span-2 shadow-sm border-t-4 border-t-primary">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold font-heading text-slate-800">Department-wise Research Activity</h2>
                        <button className="text-sm font-bold text-primary hover:underline">Download CSV</button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="projects" fill="#800000" radius={[6, 6, 0, 0]} barSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Donut Chart - Student Participation */}
                <Card className="shadow-sm border-t-4 border-t-secondary">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold font-heading text-slate-800">Student Participation Rate</h2>
                    </div>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={participationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {participationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-4 pointer-events-none">
                            <span className="text-4xl font-black text-slate-800 tracking-tight">70%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* System Health / Recent Flags */}
            <Card className="shadow-sm">
                <h2 className="text-xl font-bold font-heading text-slate-800 mb-6 flex items-center gap-3">
                    <AlertTriangle size={24} className="text-orange-500" /> Recent Moderation Flags
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-canvas border-b border-slate-200">
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Report Details</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 pb-2">
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">Profile Report</td>
                                <td className="py-5 px-6 text-sm text-slate-600 font-medium">Inappropriate content in student bio (ID: #4092)</td>
                                <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">Pending Review</span>
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1 justify-end w-full">Investigate <ArrowRight size={14} /></button>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="py-5 px-6 text-sm font-bold font-heading text-slate-800">System Alert</td>
                                <td className="py-5 px-6 text-sm text-slate-600 font-medium">API rate limit exceeded on Recommendation Engine</td>
                                <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">Resolved</span>
                                </td>
                                <td className="py-5 px-6 text-right">
                                    <button className="text-sm font-bold text-slate-400 hover:text-slate-600 w-full text-right transition-colors">View Logs</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

        </DashboardLayout>
    );
};

export default AdminDashboard;
