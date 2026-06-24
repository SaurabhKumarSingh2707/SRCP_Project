import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import Button from '../../components/common/Button';
const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const limit = 20;

    const [activeTab, setActiveTab] = useState('STUDENT'); // STUDENT, FACULTY, ADMIN

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // CREATE or EDIT
    const [currentUser, setCurrentUser] = useState({ fullName: '', email: '', role: 'STUDENT', password: '', department: '', batch: '', section: '', registerNumber: '', dateOfBirth: '' });

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState({ department: '', batch: '', section: '', file: null });

    const [selectedUsers, setSelectedUsers] = useState([]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('sarc_token');
            const query = new URLSearchParams({
                page: currentPage,
                limit,
                role: activeTab,
                search: appliedSearchTerm
            }).toString();

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/all?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.total || 0);
        } catch (error) {
            console.error(error);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = () => {
        setAppliedSearchTerm(searchTerm);
        setCurrentPage(1);
    };

    useEffect(() => {
        // Fetch users whenever appliedSearchTerm, currentPage, or activeTab changes
        setSelectedUsers([]);
        fetchUsers();
    }, [currentPage, activeTab, appliedSearchTerm]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/bulk-delete`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedUsers })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            setMessage({ text: `Successfully deleted ${selectedUsers.length} users`, type: 'success' });
            setSelectedUsers([]);
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleTabChange = (role) => {
        setActiveTab(role);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenModal = (mode, user = null) => {
        setModalMode(mode);
        if (mode === 'EDIT' && user) {
            setCurrentUser({ 
                ...user, 
                password: '',
                department: user.studentProfile?.department || user.facultyProfile?.department || user.adminProfile?.department || '',
                batch: user.studentProfile?.batch || '',
                section: user.studentProfile?.section || '',
                registerNumber: user.registerNumber || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
            });
        } else {
            setCurrentUser({ fullName: '', email: '', role: activeTab, password: '', department: '', batch: '', section: '', registerNumber: '', dateOfBirth: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sarc_token');
            const url = modalMode === 'CREATE' ? `${import.meta.env.VITE_API_URL}/api/users` : `${import.meta.env.VITE_API_URL}/api/users/${currentUser.id}`;
            const method = modalMode === 'CREATE' ? 'POST' : 'PUT';

            const payload = { ...currentUser };
            if (modalMode === 'EDIT' && !payload.password) {
                delete payload.password; // Don't send empty password on edit
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessage({ text: `User ${modalMode === 'CREATE' ? 'created' : 'updated'} successfully`, type: 'success' });
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('sarc_token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message);
            }

            setMessage({ text: 'User deleted successfully', type: 'success' });
            fetchUsers();
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        }
    };

    const executeExcelUpload = async (e) => {
        e.preventDefault();
        const file = importData.file;
        if (!file) {
            setMessage({ text: 'Please select a file to import', type: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const XLSX = await import('xlsx');
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setMessage({ text: 'Excel file is empty', type: 'error' });
                    return;
                }

                // Explicitly check for required columns in the sheet headers
                const firstRow = data[0] || {};
                const headers = Object.keys(firstRow).map(h => h.trim().toLowerCase());
                const missingColumns = [];
                
                const hasHeader = (possibleNames) => possibleNames.some(name => headers.includes(name.toLowerCase()));

                if (!hasHeader(['Name', 'fullName', 'full name'])) missingColumns.push('Name');
                if (!hasHeader(['Register Number', 'registerNumber', 'studentId', 'register no', 'reg no'])) missingColumns.push('Register Number');
                if (!hasHeader(['Email'])) missingColumns.push('Email');
                if (!hasHeader(['Password'])) missingColumns.push('Password');
                if (!hasHeader(['Department'])) missingColumns.push('Department');
                if (activeTab === 'STUDENT' && !hasHeader(['DOB', 'Date of Birth', 'dateOfBirth', 'DateOfBirth', 'Date of birth'])) missingColumns.push('DOB (Date of Birth)');

                if (missingColumns.length > 0) {
                    const foundColumns = Object.keys(firstRow).join(', ');
                    setMessage({ text: `Missing required columns: ${missingColumns.join(', ')}. Found: ${foundColumns || 'None'}`, type: 'error' });
                    return;
                }

                // Create a unified mapping of actual column names found in the sheet
                const colMap = {};
                Object.keys(firstRow).forEach(key => {
                    colMap[key.trim().toLowerCase()] = key;
                });

                const getValFromMap = (row, possibleNames) => {
                    for (let name of possibleNames) {
                        const actualKey = colMap[name.toLowerCase()];
                        if (actualKey && row[actualKey] !== undefined) {
                            return String(row[actualKey]).trim();
                        }
                    }
                    return '';
                };

                const usersPayload = data.map(row => {
                    return {
                        fullName: getValFromMap(row, ['Name', 'fullName', 'full name']),
                        email: getValFromMap(row, ['Email', 'email']),
                        password: getValFromMap(row, ['Password', 'password']) || 'password123',
                        role: (getValFromMap(row, ['Role', 'role']) || activeTab).toUpperCase(),
                        department: getValFromMap(row, ['Department', 'department']) || importData.department || '',
                        yearOfStudy: getValFromMap(row, ['YearOfStudy', 'yearOfStudy', 'year of study']) || '',
                        batch: getValFromMap(row, ['Batch', 'batch']) || importData.batch || '',
                        section: getValFromMap(row, ['Section', 'section']) || importData.section || '',
                        designation: getValFromMap(row, ['Designation', 'designation']) || '',
                        studentId: getValFromMap(row, ['Register Number', 'registerNumber', 'studentId', 'register no', 'reg no']) || '',
                        dateOfBirth: getValFromMap(row, ['Date of Birth', 'dateOfBirth', 'dob', 'DateOfBirth', 'Date of birth']) || ''
                    };
                }).filter(u => u.email && u.fullName && u.studentId && u.department && u.password);

                if (usersPayload.length === 0) {
                    setMessage({ text: 'No valid rows found. Please ensure all required columns contain values.', type: 'error' });
                    return;
                }

                if (!window.confirm(`Are you sure you want to import ${usersPayload.length} users?`)) return;

                const token = localStorage.getItem('sarc_token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/bulk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ users: usersPayload })
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.message);

                setMessage({ text: `Imported ${result.createdCount} users successfully. ${result.errors?.length > 0 ? result.errors.length + ' duplicates/errors occurred.' : ''}`, type: 'success' });
                setIsImportModalOpen(false);
                setImportData({ department: '', batch: '', section: '', file: null });
                fetchUsers();
            } catch (error) {
                console.error(error);
                setMessage({ text: error.message || 'Error parsing Excel file', type: 'error' });
            }
        };
        reader.readAsBinaryString(file);
    };

    // Removed top-level loading return so the search bar doesn't unmount

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">User Management</h1>
                    <p className="text-text-secondary">Add, edit, or remove users and manage their data.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 w-full md:w-64">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                            <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-canvas border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <Button onClick={handleSearch} className="px-4 py-2 !h-auto">
                            Search
                        </Button>
                    </div>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex justify-center items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-surface/80 rounded-xl font-medium text-text-primary text-sm cursor-pointer transition-colors w-full sm:w-auto">
                        <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    {selectedUsers.length > 0 && (
                        <button onClick={handleBulkDelete} className="flex justify-center items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl font-medium text-sm transition-colors w-full sm:w-auto">
                            <Trash2 className="w-4 h-4" /> Delete Selected ({selectedUsers.length})
                        </button>
                    )}
                    <Button onClick={() => handleOpenModal('CREATE')} className="flex justify-center items-center gap-2 w-full sm:w-auto">
                        <Plus className="w-4 h-4" /> Add User
                    </Button>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-green-500/10 border border-green-500/20 text-green-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
                {['STUDENT', 'FACULTY', 'ADMIN'].map(role => (
                    <button
                        key={role}
                        onClick={() => handleTabChange(role)}
                        className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                            activeTab === role 
                            ? 'border-accent text-accent bg-accent/5' 
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                        }`}
                    >
                        {role === 'FACULTY' ? 'Faculty' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
                    </button>
                ))}
            </div>

            {/* Unified Data Table Based on Tab */}
            <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden mb-6">
                <div className="px-6 py-4 bg-surface border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-text-primary">
                        {activeTab === 'FACULTY' ? 'Faculty' : activeTab.charAt(0) + activeTab.slice(1).toLowerCase() + 's'}
                    </h3>
                    <span className="text-xs font-bold bg-accent/10 text-accent px-2 py-1 rounded-md">
                        {totalUsers} Total
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="p-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-canvas"
                                        checked={users.length > 0 && selectedUsers.length === users.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 text-sm font-medium text-text-secondary">Name</th>
                                <th className="p-4 text-sm font-medium text-text-secondary">Email</th>
                                {activeTab === 'STUDENT' && <th className="p-4 text-sm font-medium text-text-secondary">Dept & Batch</th>}
                                {activeTab === 'STUDENT' && <th className="p-4 text-sm font-medium text-text-secondary">DOB</th>}
                                {activeTab === 'FACULTY' && <th className="p-4 text-sm font-medium text-text-secondary">Department</th>}
                                {activeTab === 'FACULTY' && <th className="p-4 text-sm font-medium text-text-secondary">Designation</th>}
                                {activeTab === 'ADMIN' && <th className="p-4 text-sm font-medium text-text-secondary">Department</th>}
                                <th className="p-4 text-sm font-medium text-text-secondary">Joined</th>
                                <th className="p-4 text-sm font-medium text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-text-secondary">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-text-secondary">No users found.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="border-b border-border/50 hover:bg-surface/80">
                                        <td className="p-4">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-canvas"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                            />
                                        </td>
                                        <td className="p-4 text-sm text-text-primary font-medium">{user.fullName}</td>
                                        <td className="p-4 text-sm text-text-secondary">{user.email}</td>
                                        {activeTab === 'STUDENT' && (
                                            <td className="p-4 text-sm text-text-secondary">
                                                {user.studentProfile?.department ? `${user.studentProfile.department} ` : ''}
                                                {user.studentProfile?.batch ? `Batch ${user.studentProfile.batch}` : '-'}
                                            </td>
                                        )}
                                        {activeTab === 'STUDENT' && (
                                            <td className="p-4 text-sm text-text-secondary">
                                                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
                                            </td>
                                        )}
                                        {activeTab === 'FACULTY' && <td className="p-4 text-sm text-text-secondary">{user.facultyProfile?.department || '-'}</td>}
                                        {activeTab === 'FACULTY' && <td className="p-4 text-sm text-text-secondary">{user.facultyProfile?.designation || '-'}</td>}
                                        {activeTab === 'ADMIN' && <td className="p-4 text-sm text-text-secondary">{user.adminProfile?.department || '-'}</td>}
                                        <td className="p-4 text-sm text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenModal('EDIT', user)} className="p-1.5 text-text-secondary hover:text-accent transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/30">
                        <span className="text-sm text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm"
                            >
                                Previous
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
                            <h2 className="text-xl font-bold text-text-primary">{modalMode === 'CREATE' ? 'Add New User' : 'Edit User'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                                <input 
                                    type="text" required
                                    value={currentUser.fullName}
                                    onChange={(e) => setCurrentUser({...currentUser, fullName: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                <input 
                                    type="email" required
                                    value={currentUser.email}
                                    onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            {currentUser.role === 'STUDENT' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Register Number</label>
                                        <input 
                                            type="text" required
                                            value={currentUser.registerNumber}
                                            onChange={(e) => setCurrentUser({...currentUser, registerNumber: e.target.value})}
                                            className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Date of Birth</label>
                                        <input 
                                            type="date" required
                                            value={currentUser.dateOfBirth}
                                            onChange={(e) => setCurrentUser({...currentUser, dateOfBirth: e.target.value})}
                                            className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                <select 
                                    value={currentUser.role}
                                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                    disabled={modalMode === 'EDIT'} // Prevent changing role of existing users safely
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="FACULTY">FACULTY</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="INDUSTRY">INDUSTRY</option>
                                </select>
                            </div>
                            
                            {currentUser.role === 'STUDENT' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Department</label>
                                        <input 
                                            type="text" 
                                            value={currentUser.department || ''}
                                            onChange={(e) => setCurrentUser({...currentUser, department: e.target.value})}
                                            placeholder="e.g. CSE"
                                            className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Batch</label>
                                        <input 
                                            type="text" 
                                            value={currentUser.batch || ''}
                                            onChange={(e) => setCurrentUser({...currentUser, batch: e.target.value})}
                                            placeholder="e.g. 2026"
                                            className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Password {modalMode === 'EDIT' && <span className="text-xs font-normal opacity-70">(Leave blank to keep unchanged)</span>}
                                </label>
                                <input 
                                    type="password" 
                                    required={modalMode === 'CREATE'}
                                    value={currentUser.password}
                                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                    className="w-full bg-canvas border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
                                />
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Save User</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
                            <h2 className="text-xl font-bold text-text-primary">Import {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}s from Excel</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={executeExcelUpload} className="p-6 space-y-4 overflow-y-auto">
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-canvas border-2 border-border border-dashed rounded-xl appearance-none cursor-pointer hover:border-accent hover:bg-surface focus:outline-none">
                                    <span className="flex items-center space-x-2">
                                        <Upload className="w-6 h-6 text-text-secondary group-hover:text-accent transition-colors" />
                                        <span className="font-medium text-text-secondary">
                                            {importData.file ? importData.file.name : "Drop files to attach, or browse"}
                                        </span>
                                    </span>
                                    <input 
                                        type="file" 
                                        name="file_upload" 
                                        className="hidden" 
                                        accept=".xlsx, .xls, .csv" 
                                        required
                                        onChange={(e) => setImportData({...importData, file: e.target.files[0]})}
                                    />
                                </label>
                            </div>
                            <div className="text-xs text-text-secondary text-center mb-4">
                                Expected columns: <span className="font-semibold text-text-primary">Name, Register Number, Email, Password, Department, DOB</span>
                            </div>

                            {activeTab === 'STUDENT' && (
                                <div className="bg-canvas rounded-xl p-4 border border-border">
                                    <div className="text-sm font-medium text-text-primary mb-1">
                                        Batch Assignment
                                    </div>
                                    <div className="text-xs text-text-secondary mb-4">
                                        These values are mandatory and will be assigned to all imported students.
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">Department</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={importData.department}
                                                onChange={(e) => setImportData({...importData, department: e.target.value})}
                                                placeholder="e.g. CSE"
                                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">Batch</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={importData.batch}
                                                onChange={(e) => setImportData({...importData, batch: e.target.value})}
                                                placeholder="e.g. 2026"
                                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Import Data</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
