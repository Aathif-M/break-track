import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import Timer from '../components/Timer';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Layout from '../components/Layout';

const ManagerDashboard = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Check if we are on the main dashboard page (not a sub-route)
    const isMainDashboard = location.pathname === '/manager' || location.pathname === '/manager/';

    const navLinks = (
        <>
            <Link to="/manager" className={`block py-2 px-4 rounded mb-2 ${isMainDashboard ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>Dashboard</Link>
            <Link to="/manager/agents" className={`block py-2 px-4 rounded mb-2 ${location.pathname.includes('/agents') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>{user.role === 'SUPER_ADMIN' ? 'Users' : 'Agents'}</Link>
            <Link to="/manager/breaks" className={`block py-2 px-4 rounded mb-2 ${location.pathname.includes('/breaks') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>Breaks</Link>
            <Link to="/manager/history" className={`block py-2 px-4 rounded mb-2 ${location.pathname.includes('/history') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}>History & Analytics</Link>
        </>
    );

    return (
        <Layout navLinks={navLinks}>
            <header className="bg-white shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    {isMainDashboard ? 'Manager Dashboard' :
                        location.pathname.includes('/agents') ? 'Agent Management' :
                            location.pathname.includes('/breaks') ? 'Break Management' :
                                'Break History & Analytics'}
                </h2>
            </header>

            <div className="p-6 pt-0">
                {isMainDashboard ? <DashboardContent /> : <Outlet />}
            </div>
        </Layout>
    );
};

const DashboardContent = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        if (user?.mustChangePassword) {
            setIsChangePasswordOpen(true);
        }
    }, [user]);

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('break_update', () => {
            fetchAgents();
        });

        return () => socket.off('break_update');
    }, [socket]);

    const fetchAgents = async () => {
        try {
            const res = await api.get('/users');
            // console.log(res.data);
            setAgents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Team Breaks Feed</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-4 text-gray-600 font-medium">ID</th>
                            <th className="p-4 text-gray-600 font-medium">Agent Name</th>
                            <th className="p-4 text-gray-600 font-medium">Role</th>
                            <th className="p-4 text-gray-600 font-medium">Status</th>
                            <th className="p-4 text-gray-600 font-medium">Break Type</th>
                            <th className="p-4 text-gray-600 font-medium">Start Time</th>
                            <th className="p-4 text-gray-600 font-medium">Expected End</th>
                            <th className="p-4 text-gray-600 font-medium">Timer/Violation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => {
                            const activeSession = agent.breakSessions?.[0];
                            return (
                                <tr key={agent.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 text-gray-500">#{agent.id.toString().padStart(3, '0')}</td>
                                    <td className="p-4 font-medium">{agent.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${agent.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {agent.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeSession
                                                ? 'bg-blue-100 text-blue-800'
                                                : agent.isOnline
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {activeSession ? 'On-Break' : agent.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                            {!agent.isOnline && !activeSession && agent.lastLogin && (
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {new Date(agent.lastLogin).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{activeSession?.breakType?.name || '--'}</td>
                                    <td className="p-4 text-gray-600">
                                        {activeSession ? new Date(activeSession.startTime).toLocaleTimeString() : '--'}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {activeSession ? new Date(activeSession.expectedEndTime).toLocaleTimeString() : '--'}
                                    </td>
                                    <td className="p-4">
                                        {activeSession ? (
                                            <Timer
                                                startTime={activeSession.startTime}
                                                expectedEndTime={activeSession.expectedEndTime}
                                                status={activeSession.status}
                                            />
                                        ) : '--'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                forceChange={user?.mustChangePassword}
                onSubmit={() => {
                    updateUser({ ...user, mustChangePassword: false });
                    setIsChangePasswordOpen(false);
                }}
            />
        </div>
    );
};

export default ManagerDashboard;
