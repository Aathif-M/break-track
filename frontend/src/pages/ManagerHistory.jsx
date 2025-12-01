import { useState, useEffect } from 'react';
import api from '../api/axios';
import html2pdf from 'html2pdf.js';

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
        if (!endTime) return { minutes: 0, display: '--' };
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

    const formatMinutesToHM = (minutes) => {
        if (!minutes || minutes === 0) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
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

    const exportToPDF = () => {
        if (filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';

        // Title
        const title = document.createElement('h1');
        title.textContent = 'Break History Report';
        title.style.textAlign = 'center';
        title.style.marginBottom = '10px';
        title.style.fontSize = '28px';
        title.style.color = '#1e3a8a';
        title.style.fontWeight = '600';

        element.appendChild(title);

        // Export date
        const date = document.createElement('p');
        date.textContent = `Generated: ${new Date().toLocaleString()}`;
        date.style.textAlign = 'center';
        date.style.color = '#666';
        date.style.marginBottom = '20px';
        date.style.fontSize = '16px';
        element.appendChild(date);

        // Statistics Section
        const statsDiv = document.createElement('div');
        statsDiv.style.marginBottom = '20px';
        statsDiv.style.pageBreakInside = 'avoid';
        const statsTitle = document.createElement('h2');
        statsTitle.textContent = 'Summary Statistics';
        statsTitle.style.fontSize = '18px';
        statsTitle.style.borderBottom = '2px solid #1e3a8a';
        statsTitle.style.paddingBottom = '10px';
        statsTitle.style.marginBottom = '10px';
        statsDiv.appendChild(statsTitle);

        const statsGrid = document.createElement('div');
        statsGrid.style.display = 'grid';
        statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        statsGrid.style.gap = '10px';
        statsGrid.style.marginBottom = '15px';

        const statItems = [
            { label: 'Total Sessions', value: stats.totalSessions },
            { label: 'Completed Sessions', value: stats.completedSessions },
            { label: 'Break Violations', value: stats.violationCount },
            { label: 'Total Duration', value: formatMinutesToHM(stats.totalDuration) }
        ];

        statItems.forEach(item => {
            const statBox = document.createElement('div');
            statBox.style.border = '1px solid #1e3a8a';
            statBox.style.padding = '10px';
            statBox.style.borderRadius = '5px';
            statBox.style.backgroundColor = '#eff3ffff';

            const label = document.createElement('p');
            label.textContent = item.label;
            label.style.fontSize = '12px';
            label.style.color = '#666';
            label.style.margin = '0 0 5px 0';

            const value = document.createElement('p');
            value.textContent = item.value;
            value.style.fontSize = '18px';
            value.style.fontWeight = 'bold';
            value.style.margin = '0';

            statBox.appendChild(label);
            statBox.appendChild(value);
            statsGrid.appendChild(statBox);
        });

        statsDiv.appendChild(statsGrid);
        element.appendChild(statsDiv);

        // Filters Applied Section
        const filtersDiv = document.createElement('div');
        filtersDiv.style.marginBottom = '20px';
        filtersDiv.style.pageBreakInside = 'avoid';
        const filtersTitle = document.createElement('h2');
        filtersTitle.textContent = 'Filters Applied';
        filtersTitle.style.fontSize = '16px';
        filtersTitle.style.borderBottom = '2px solid #1e3a8a';
        filtersTitle.style.paddingBottom = '10px';
        filtersTitle.style.marginBottom = '10px';
        filtersDiv.appendChild(filtersTitle);

        const filtersList = document.createElement('ul');
        filtersList.style.margin = '0';
        filtersList.style.paddingLeft = '20px';

        const filters = [
            { name: 'Agent', value: filterAgent === 'ALL' ? 'All Agents' : agents.find(a => a.id === parseInt(filterAgent))?.name || 'Unknown' },
            { name: 'Break Type', value: filterBreakType === 'ALL' ? 'All Types' : breakTypes.find(t => t.id === parseInt(filterBreakType))?.name || 'Unknown' },
            { name: 'Status', value: filterStatus === 'ALL' ? 'All Status' : filterStatus },
            { name: 'Date Range', value: dateRange === 'custom' ? `${customStartDate} to ${customEndDate}` : dateRange },
            { name: 'Sort By', value: sortBy }
        ];

        filters.forEach(filter => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = filter.value;
            span.style.color = '#000';
            span.style.fontWeight = '600';
            span.style.marginLeft = '10px';
            span.style.fontSize = '18px';
            li.textContent = `${filter.name}: `;
            li.style.marginBottom = '5px';
            li.appendChild(span);
            filtersList.appendChild(li);
        });

        filtersDiv.appendChild(filtersList);
        element.appendChild(filtersDiv);

        // Data Table Section
        const tableDiv = document.createElement('div');
        tableDiv.style.marginBottom = '20px';
        const tableTitle = document.createElement('h2');
        tableTitle.textContent = `Break Sessions (${filteredData.length} records)`;
        tableTitle.style.fontSize = '16px';
        tableTitle.style.borderBottom = '2px solid #1e3a8a';
        tableTitle.style.paddingBottom = '10px';
        tableTitle.style.marginBottom = '10px';
        tableDiv.appendChild(tableTitle);

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '11px';
        table.style.marginBottom = '20px';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#f0f0f0';
        headerRow.style.borderBottom = '2px solid #1e3a8a';

        const headers = ['Agent', 'Break Type', 'Start Time', 'End Time', 'Duration', 'Status', 'Violation'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.fontWeight = 'bold';
            th.style.borderRight = '1px solid #ddd';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        filteredData.forEach((session, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';
            if (index % 2 === 0) {
                row.style.backgroundColor = '#f9f9f9';
            }

            const cells = [
                session.user?.name || 'Unknown',
                session.breakType?.name || 'Unknown',
                new Date(session.startTime).toLocaleString(),
                session.endTime ? new Date(session.endTime).toLocaleString() : 'Ongoing',
                calculateDuration(session.startTime, session.endTime).display,
                session.status,
                session.violationDuration ? formatMinutesToHM(Math.floor(session.violationDuration / 60)) : '-'
            ];

            cells.forEach(cellContent => {
                const td = document.createElement('td');
                td.textContent = cellContent;
                td.style.padding = '8px';
                td.style.borderRight = '1px solid #ddd';
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        tableDiv.appendChild(table);
        element.appendChild(tableDiv);

        // Footer
        const footer = document.createElement('p');
        footer.textContent = 'This is an automatically generated report from Work Pulse';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '10px';
        footer.style.color = '#999';
        footer.style.marginTop = '30px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.paddingTop = '10px';
        element.appendChild(footer);

        const opt = {
            margin: 10,
            filename: `break-history-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };

        html2pdf().set(opt).from(element).save();
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
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
                    <div className="stat-card-label">Total Sessions</div>
                    <div className="stat-card-value text-2xl">{stats.totalSessions}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
                    <div className="stat-card-label">Completed Sessions</div>
                    <div className="stat-card-value text-2xl">{stats.completedSessions}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
                    <div className="stat-card-label">Break Violations</div>
                    <div className="stat-card-value text-2xl font-bold text-red-700 mt-1">{stats.violationCount}</div>
                </div>
                <div className="stat-card bg-gray-50 p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
                    <div className="stat-card-label">Total Duration</div>
                    <div className="stat-card-value text-2xl">{formatMinutesToHM(stats.totalDuration)}</div>
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
                </div>

                <div className="flex place-items-end gap-2 flex-wrap pt-4 border-t justify-end">
                    <button
                        onClick={fetchAllData}
                        className="p-4 bg-gray-700 py-2 rounded hover:bg-gray-600 transition-colors text-white"
                    >
                        ↻ Refresh
                    </button>

                    <button
                        onClick={exportToPDF}
                        className="p-4 bg-red-800 py-2 rounded hover:bg-red-700 transition-colors text-white font-semibold"
                    >
                        ↓ Export to PDF
                    </button>

                    <button
                        onClick={() => {
                            setFilterAgent('ALL');
                            setFilterBreakType('ALL');
                            setFilterStatus('ALL');
                            setDateRange('all');
                            setSearchAgent('');
                            setSortBy('recent');
                        }}
                        className="p-4 bg-blue-700 py-2 rounded hover:bg-blue-600 transition-colors text-white"
                    >
                        ⨯ Clear All Filters
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
                            <div key={agentId} className="card-inner bg-white p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
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
                                            {formatMinutesToHM(Math.floor(stats.totalViolationTime / 60))}
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
                            <div key={typeId} className="card-inner bg-white p-6 rounded-lg shadow-lg border-t-4 border-gray-500">
                                <div className="font-bold text-gray-900 mb-3 text-lg">{stats.name}</div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Instances:</span>
                                        <span className="badge badge-primary">{stats.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Duration:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatMinutesToHM(Math.floor(stats.totalDuration))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Average:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatMinutesToHM(Math.floor(stats.totalDuration / stats.count))}
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
                                                {session.endTime ? formatDateTime(session.endTime) : <span className="font-semibold text-gray-900 text-lg">--</span>}
                                            </td>
                                            <td className="p-4 font-semibold text-gray-900">
                                                {calculateDuration(session.startTime, session.endTime).display}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${session.status === 'ONGOING'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {session.violationDuration ? (
                                                    <span className="bg-red-100 text-red-800 p-1 rounded px-3">
                                                        +{formatMinutesToHM(Math.floor(session.violationDuration / 60))}
                                                    </span>
                                                ) : (
                                                    <span className="font-semibold text-gray-900">-</span>
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
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-blue-700">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Agent Name</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {session.user?.name}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-green-700">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Break Type</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {session.breakType?.name}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-purple-700">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Session ID</p>
                                                            <p className="font-bold text-gray-900 text-lg">#{session.id}</p>
                                                        </div>
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-indigo-700">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Expected Duration</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {formatMinutesToHM(Math.floor(session.breakType?.duration / 60))}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 p-6 rounded-lg shadow border-l-4 border-amber-900">
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Actual Duration</p>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {calculateDuration(session.startTime, session.endTime).display}
                                                            </p>
                                                        </div>
                                                        <div className={`bg-gray-50 p-6 rounded-lg shadow border-l-4  ${session.violationDuration ? 'border-red-600' : !session.endTime ? 'border-blue-600' : 'border-green-600'}`}>
                                                            <p className="text-xs text-gray-600 font-bold uppercase mb-1">Status</p>
                                                            <p className={`font-bold text-lg ${session.violationDuration ? 'text-red-600' : !session.endTime ? 'text-blue-600' : 'text-green-600'}`}>
                                                                {session.violationDuration
                                                                    ? ` +${formatMinutesToHM(Math.floor(session.violationDuration / 60))} (Violation)`
                                                                    : !session.endTime
                                                                        ? 'Ongoing'
                                                                        : 'On Time'}
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
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Records Shown</p>
                        <p className="text-2xl font-bold text-blue-700">{filteredData.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-gray-800">{history.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 font-bold uppercase mb-1">Average Session</p>
                        <p className="text-2xl font-bold text-purple-700">{formatMinutesToHM(stats.averageDuration)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerHistory;
