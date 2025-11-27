import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AgentHistory = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [breakHistory, setBreakHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('recent');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/breaks/history');
            setBreakHistory(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load break history');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredHistory = () => {
        let filtered = breakHistory;

        // Apply status filter
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(session => session.status === filterStatus);
        }

        // Apply sorting
        if (sortBy === 'recent') {
            filtered = [...filtered].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        } else if (sortBy === 'oldest') {
            filtered = [...filtered].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        } else if (sortBy === 'violations') {
            filtered = [...filtered].sort((a, b) => {
                const aViolation = a.violationDuration || 0;
                const bViolation = b.violationDuration || 0;
                return bViolation - aViolation;
            });
        }

        return filtered;
    };

    const calculateDuration = (startTime, endTime) => {
        if (!endTime) return '-';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = Math.floor((end - start) / 1000); // in seconds
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ONGOING':
                return 'bg-blue-100 text-blue-800';
            case 'ENDED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredData = getFilteredHistory();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-blue-900 text-white p-6 flex flex-col fixed h-screen top-0 left-0">
                <h1 className="text-2xl font-bold mb-8">Break Track</h1>
                <nav className="flex-1">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="block w-full text-left py-2 px-4 hover:bg-blue-800 rounded mb-2 transition"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="block w-full text-left py-2 px-4 bg-blue-800 rounded mb-2 transition"
                    >
                        History
                    </button>
                </nav>
                <button
                    onClick={logout}
                    className="bg-blue-700 py-2 rounded hover:bg-blue-600 w-full transition"
                >
                    Logout
                </button>
            </div>
            <div className="w-64 bg-blue-900 text-white p-6 flex flex-col"></div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Break History</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Welcome,</span>
                        <span className="font-bold text-gray-800">{user?.name}</span>
                    </div>
                </header>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="input-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ONGOING">Ongoing</option>
                                <option value="ENDED">Ended</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                <option value="violations">Most Violations</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchHistory}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <p className="text-gray-600 text-sm font-semibold">Total Breaks</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{breakHistory.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <p className="text-gray-600 text-sm font-semibold">Ongoing</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">
                            {breakHistory.filter(b => b.status === 'ONGOING').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <p className="text-gray-600 text-sm font-semibold">Completed</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">
                            {breakHistory.filter(b => b.status === 'ENDED').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <p className="text-gray-600 text-sm font-semibold">Violations</p>
                        <p className="text-3xl font-bold text-red-900 mt-2">
                            {breakHistory.filter(b => b.violationDuration).length}
                        </p>
                    </div>
                </div>

                {/* Summary Statistics */}
                {filteredData.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary for Filtered Results</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-gray-600 text-sm">Total Duration</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                    {Math.floor(
                                        filteredData.reduce((sum, session) => {
                                            if (session.endTime) {
                                                const diff = new Date(session.endTime) - new Date(session.startTime);
                                                return sum + diff / 1000;
                                            }
                                            return sum;
                                        }, 0) / 60
                                    )}{' '}
                                    m
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Avg Duration</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                    {Math.floor(
                                        filteredData.reduce((sum, session) => {
                                            if (session.endTime) {
                                                const diff = new Date(session.endTime) - new Date(session.startTime);
                                                return sum + diff / 1000;
                                            }
                                            return sum;
                                        }, 0) /
                                            (filteredData.filter(s => s.endTime).length || 1) /
                                            60
                                    )}{' '}
                                    m
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Total Violations</p>
                                <p className="text-2xl font-bold text-red-900 mt-1">
                                    {Math.floor(
                                        filteredData.reduce((sum, session) => sum + (session.violationDuration || 0), 0) / 60
                                    )}{' '}
                                    m
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Violation Rate</p>
                                <p className="text-2xl font-bold text-orange-900 mt-1">
                                    {filteredData.length > 0
                                        ? Math.round(
                                            (filteredData.filter(s => s.violationDuration).length / filteredData.length) *
                                                100
                                        )
                                        : 0}
                                    %
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Table Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin">
                                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                            <p className="text-gray-600 mt-4">Loading break history...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-red-600 font-semibold">{error}</p>
                            <button
                                onClick={fetchHistory}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 text-lg">No break history found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Break Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Start Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            End Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Violation
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((session) => (
                                        <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                {session.breakType.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDateTime(session.startTime)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {session.endTime ? formatDateTime(session.endTime) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {calculateDuration(session.startTime, session.endTime)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                        session.status
                                                    )}`}
                                                >
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {session.violationDuration ? (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        +{Math.floor(session.violationDuration / 60)}m{' '}
                                                        {session.violationDuration % 60}s
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                
            </div>
        </div>
    );
};

export default AgentHistory;
