import { useState, useEffect } from 'react';
import api from '../api/axios';

const ManagerHistory = () => {
    const [history, setHistory] = useState([]);
    const [agents, setAgents] = useState([]);
    const [breakTypes, setBreakTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and sort states
    const [filterAgent, setFilterAgent] = useState('ALL');
    const [filterBreakType, setFilterBreakType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('recent');
    const [dateRange, setDateRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [searchAgent, setSearchAgent] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [historyRes, agentsRes, typesRes] = await Promise.all([
                api.get('/breaks/history/all'),
                api.get('/users'),
                api.get('/breaks/types')
            ]);

            setHistory(historyRes.data || []);
            setAgents(agentsRes.data || []);
            setBreakTypes(typesRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load break history');
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateRange) {
            case 'today':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
            case 'month':
                return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
            case 'custom':
                if (customStartDate && customEndDate) {
                    return { start: new Date(customStartDate), end: new Date(customEndDate) };
                }
                return null;
            default:
                return null;
        }
    };

    const getFilteredHistory = () => {
        let filtered = history;

        // Agent filter
        if (filterAgent !== 'ALL') {
            filtered = filtered.filter(session => session.userId === parseInt(filterAgent));
        }

        // Search agent
        if (searchAgent) {
            const lowerSearch = searchAgent.toLowerCase();
            filtered = filtered.filter(session =>
                session.user?.name?.toLowerCase().includes(lowerSearch)
            );
        }

        // Break type filter
        if (filterBreakType !== 'ALL') {
            filtered = filtered.filter(session => session.breakTypeId === parseInt(filterBreakType));
        }

        // Status filter
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(session => session.status === filterStatus);
        }

        // Date range filter
        const dateRangeObj = getDateRange();
        if (dateRangeObj) {
            filtered = filtered.filter(session => {
                const sessionDate = new Date(session.startTime);
                return sessionDate >= dateRangeObj.start && sessionDate < dateRangeObj.end;
            });
        }

        // Sorting
        const sorted = [...filtered];
        switch (sortBy) {
            case 'recent':
                sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                break;
            case 'longest':
                sorted.sort((a, b) => {
                    const aDur = a.endTime ? new Date(a.endTime) - new Date(a.startTime) : 0;
                    const bDur = b.endTime ? new Date(b.endTime) - new Date(b.startTime) : 0;
                    return bDur - aDur;
                });
                break;
            case 'violations':
                sorted.sort((a, b) => (b.violationDuration || 0) - (a.violationDuration || 0));
                break;
            case 'agent':
                sorted.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
                break;
            default:
                break;
        }

        return sorted;
    };

    const calculateDuration = (startTime, endTime) => {
        if (!endTime) return { minutes: 0, display: '-' };
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = Math.floor((end - start) / 1000); // in seconds
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return { minutes: mins, display: `${mins}m ${secs}s` };
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ONGOING':
                return 'badge-primary';
            case 'ENDED':
                return 'badge-success';
            default:
                return 'badge-info';
        }
    };

    const filteredData = getFilteredHistory();

    // Calculate statistics
    const stats = {
        totalSessions: filteredData.length,
        completedSessions: filteredData.filter(s => s.status === 'ENDED').length,
        ongoingSessions: filteredData.filter(s => s.status === 'ONGOING').length,
        totalDuration: Math.floor(
            filteredData.reduce((sum, s) => {
                if (s.endTime) {
                    return sum + (new Date(s.endTime) - new Date(s.startTime)) / 1000;
                }
                return sum;
            }, 0) / 60
        ),
        violationCount: filteredData.filter(s => s.violationDuration).length,
        totalViolationTime: Math.floor(
            filteredData.reduce((sum, s) => sum + (s.violationDuration || 0), 0) / 60
        ),
        averageDuration: Math.floor(
            filteredData.reduce((sum, s) => {
                if (s.endTime) {
                    return sum + (new Date(s.endTime) - new Date(s.startTime)) / 1000;
                }
                return sum;
            }, 0) / (filteredData.filter(s => s.endTime).length || 1) / 60
        ),
    };

    const agentStats = filteredData.reduce((acc, session) => {
        const agentId = session.userId;
        if (!acc[agentId]) {
            acc[agentId] = {
                name: session.user?.name || 'Unknown',
                count: 0,
                violations: 0,
                totalViolationTime: 0,
            };
        }
        acc[agentId].count++;
        if (session.violationDuration) {
            acc[agentId].violations++;
            acc[agentId].totalViolationTime += session.violationDuration;
        }
        return acc;
    }, {});

    const breakTypeStats = filteredData.reduce((acc, session) => {
        const typeId = session.breakTypeId;
        if (!acc[typeId]) {
            acc[typeId] = {
                name: session.breakType?.name || 'Unknown',
                count: 0,
                totalDuration: 0,
            };
        }
        acc[typeId].count++;
        if (session.endTime) {
            acc[typeId].totalDuration += (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60;
        }
        return acc;
    }, {});

    return (
        <div className="main-content">

            {error && (
                <div className="alert alert-danger mb-6 fade-in">
                    <div className="font-semibold mb-2">Error Loading History</div>
                    {error}
                    <button onClick={fetchAllData} className="ml-2 underline font-semibold block mt-2">
                        ↻ Retry
                    </button>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid bg-white p-6 rounded-lg shadow grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow">
                    <div className="stat-card-label">Total Sessions</div>
                    <div className="stat-card-value text-2xl">{stats.totalSessions}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow">
                    <div className="stat-card-label">Completed Sessions</div>
                    <div className="stat-card-value text-2xl">{stats.completedSessions}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow">
                    <div className="stat-card-label">Break Violations</div>
                    <div className="stat-card-value text-2xl font-bold text-red-700 mt-1">{stats.violationCount}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow">
                    <div className="stat-card-label">Total Duration</div>
                    <div className="stat-card-value text-2xl">{stats.totalDuration} <span className="text-lg">mins</span></div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="card bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-900">
                <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                    <span>Filters & Search</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search Agent</label>
                        <input
                            type="text"
                            placeholder="Search agent name..."
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Agent</label>
                        <select
                            value={filterAgent}
                            onChange={(e) => setFilterAgent(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="ALL">All Agents</option>
                            {agents.filter(a => a.role === 'AGENT').map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Break Type</label>
                        <select
                            value={filterBreakType}
                            onChange={(e) => setFilterBreakType(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="ALL">All Types</option>
                            {breakTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ONGOING">Ongoing</option>
                            <option value="ENDED">Ended</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateRange === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full input-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="oldest">Oldest First</option>
                            <option value="longest">Longest Duration</option>
                            <option value="violations">Most Violations</option>
                            <option value="agent">Agent Name</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={fetchAllData}
                            className="flex-1 btn-primary"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap pt-4 border-t">
                    <button
                        onClick={() => {
                            setFilterAgent('ALL');
                            setFilterBreakType('ALL');
                            setFilterStatus('ALL');
                            setDateRange('all');
                            setSearchAgent('');
                            setSortBy('recent');
                        }}
                        className="btn-secondary"
                    >
                        Clear All Filters
                    </button>
                </div>
            </div>

            {/* Agent Stats */}
            {Object.keys(agentStats).length > 0 && (
                <div className="card bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-900">
                    <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <span>Agent Performance</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(agentStats).map(([agentId, stats]) => (
                            <div key={agentId} className="card-inner bg-white p-6 rounded-lg shadow border-t-4 border-blue-900">
                                <div className="font-bold text-gray-900 mb-3 text-lg">{stats.name}</div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Breaks Taken:</span>
                                        <span className="badge badge-primary">{stats.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Violations:</span>
                                        <span className={`badge ${stats.violations > 0 ? 'badge-danger' : 'badge-success'}`}>
                                            {stats.violations}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Violation:</span>
                                        <span className="badge badge-warning">
                                            {Math.floor(stats.totalViolationTime / 60)}m
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Break Type Stats */}
            {Object.keys(breakTypeStats).length > 0 && (
                <div className="card bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-900">
                    <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <span>Break Type Summary</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(breakTypeStats).map(([typeId, stats]) => (
                            <div key={typeId} className="card-inner bg-white p-6 rounded-lg shadow border-t-4 border-blue-900">
                                <div className="font-bold text-gray-900 mb-3 text-lg">{stats.name}</div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Instances:</span>
                                        <span className="badge badge-primary">{stats.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Duration:</span>
                                        <span className="font-semibold text-gray-900">
                                            {Math.floor(stats.totalDuration)}m
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Average:</span>
                                        <span className="font-semibold text-gray-900">
                                            {Math.floor(stats.totalDuration / stats.count)}m
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="card bg-white p-6 rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>Break Sessions</span>
                        <span className="text-sm font-normal text-gray-600">({filteredData.length})</span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading break history...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 text-lg font-medium">No break records found.</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Break Type</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Start Time</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">End Time</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Violation</th>
                                    <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(session => (
                                    <>
                                        <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50 transition duration-200">
                                            <td className="p-4 font-semibold text-gray-900">{session.user?.name || 'Unknown'}</td>
                                            <td className="p-4 text-gray-700">{session.breakType?.name}</td>
                                            <td className="p-4 text-gray-700 text-sm">{formatDateTime(session.startTime)}</td>
                                            <td className="p-4 text-gray-700 text-sm">
                                                {session.endTime ? formatDateTime(session.endTime) : <span className="text-orange-600 font-medium">Ongoing</span>}
                                            </td>
                                            <td className="p-4 font-semibold text-gray-900">
                                                {calculateDuration(session.startTime, session.endTime).display}
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge ${getStatusColor(session.status)}`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {session.violationDuration ? (
                                                    <span className="badge badge-danger text-red-400 text-lg">
                                                        +{Math.floor(session.violationDuration / 60)}m
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-success">✓ On Time</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setExpandedRow(expandedRow === session.id ? null : session.id)}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-sm transition"
                                                >
                                                    {expandedRow === session.id ? '▼ Hide' : '▶ View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === session.id && (
                                            <tr className="bg-blue-10 fade-in">
                                                <td colSpan="8" className="p-6 border-b border-blue-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-900">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Agent Name</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {session.user?.name}
                                                            </p>
                                                        </div>
                                                        <div className="card p-4 border-l-4 border-green-600 bg-white shadow">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Break Type</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {session.breakType?.name}
                                                            </p>
                                                        </div>
                                                        <div className="card p-4 border-l-4 border-purple-600 bg-white shadow">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Session ID</p>
                                                            <p className="font-bold text-gray-900 text-lg">#{session.id}</p>
                                                        </div>
                                                        <div className="card p-4 border-l-4 border-indigo-600 bg-white shadow">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Expected Duration</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {Math.floor(session.breakType?.duration / 60)}m
                                                            </p>
                                                        </div>
                                                        <div className="card p-4 border-l-4 border-amber-600 bg-white shadow">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Actual Duration</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {calculateDuration(session.startTime, session.endTime).display}
                                                            </p>
                                                        </div>
                                                        <div className={`card p-4 border-l-4 bg-white shadow ${session.violationDuration ? 'border-red-600' : !session.endTime ? 'border-blue-600' : 'border-green-600'}`}>
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Status</p>
                                                            <p className={`font-bold text-lg ${session.violationDuration ? 'text-red-600' : !session.endTime ? 'text-blue-600' : 'text-green-600'}`}>
                                                                {session.violationDuration
                                                                    ? ` +${Math.floor(session.violationDuration / 60)}m (Over)`
                                                                    : !session.endTime
                                                                        ? 'Ongoing'
                                                                        : '✓ On Time'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="card p-6 border-l-4 border-blue-900 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Records Shown</p>
                        <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-gray-800">{history.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Average Session</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.averageDuration}m</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerHistory;
