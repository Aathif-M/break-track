import { useState, useEffect } from 'react';
import api from '../api/axios';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.userId) params.append('userId', filters.userId);

            const res = await api.get(`/breaks/reports?${params.toString()}`);
            setReports(res.data);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchReports();
    };

    return (
        <div className="p-8">
            {/* <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports</h2> */}

            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <select
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                        >
                            <option value="">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
                    >
                        Generate Report
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-gray-600 font-medium">Agent</th>
                            <th className="p-4 text-gray-600 font-medium">Break Type</th>
                            <th className="p-4 text-gray-600 font-medium">Start Time</th>
                            <th className="p-4 text-gray-600 font-medium">End Time</th>
                            <th className="p-4 text-gray-600 font-medium">Duration</th>
                            <th className="p-4 text-gray-600 font-medium">Violation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No records found. Adjust filters to see data.
                                </td>
                            </tr>
                        ) : (
                            reports.map(session => (
                                <tr key={session.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{session.user?.name || 'Unknown'}</td>
                                    <td className="p-4 text-gray-600">{session.breakType.name}</td>
                                    <td className="p-4 text-gray-600">{new Date(session.startTime).toLocaleString()}</td>
                                    <td className="p-4 text-gray-600">{session.endTime ? new Date(session.endTime).toLocaleString() : '-'}</td>
                                    <td className="p-4 text-gray-600">
                                        {session.endTime
                                            ? Math.floor((new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60) + ' mins'
                                            : '-'}
                                    </td>
                                    <td className="p-4">
                                        {session.violationDuration ? (
                                            <span className="text-red-600 font-medium">{Math.floor(session.violationDuration / 60)} mins</span>
                                        ) : (
                                            <span className="text-green-600">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
