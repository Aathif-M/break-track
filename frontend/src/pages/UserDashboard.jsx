import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Timer from '../components/Timer';
import ChangePasswordModal from '../components/ChangePasswordModal';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [breakTypes, setBreakTypes] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        if (user?.mustChangePassword) {
            setIsChangePasswordOpen(true);
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [typesRes, historyRes] = await Promise.all([
                api.get('/breaks/types'),
                api.get('/breaks/history')
            ]);
            setBreakTypes(typesRes.data);
            setHistory(historyRes.data);

            // Check for ongoing session in history (or separate endpoint)
            const ongoing = historyRes.data.find(s => s.status === 'ONGOING');
            if (ongoing) {
                setCurrentSession(ongoing);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const startBreak = async (breakTypeId) => {
        try {
            const res = await api.post('/breaks/start', { breakTypeId });
            setCurrentSession(res.data);
            fetchData(); // Refresh history
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to start break');
        }
    };

    const endBreak = async () => {
        try {
            await api.post('/breaks/end');
            setCurrentSession(null);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-blue-900 text-white p-6 flex flex-col fixed h-screen top-0 left-0">
                <h1 className="text-2xl font-bold mb-8">Break Track</h1>
                <nav className="flex-1">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="block w-full text-left py-2 px-4 bg-blue-800 rounded mb-2 transition hover:bg-blue-700"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="block w-full text-left py-2 px-4 hover:bg-blue-800 rounded mb-2 transition"
                    >
                        History
                    </button>
                </nav>
                <button onClick={logout} className="bg-blue-700 py-2 rounded hover:bg-blue-600 transition w-full">Logout</button>
            </div>
            <div className="w-64 bg-blue-900 text-white p-6 flex flex-col">
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">User Dashboard</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Welcome,</span>
                        <span className="font-bold">{user.name}</span>
                    </div>
                </header>

                {/* Active Break Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-semibold">Current Status</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentSession
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {currentSession ? 'On-Break' : 'Online'}
                        </span>
                    </div>
                    {currentSession ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-2">You are on a</p>
                            <h2 className="text-3xl font-bold text-blue-900 mb-4">{currentSession.breakType.name}</h2>
                            <div className="mb-8">
                                <Timer
                                    startTime={currentSession.startTime}
                                    expectedEndTime={currentSession.expectedEndTime}
                                    status={currentSession.status}
                                />
                            </div>
                            <button
                                onClick={endBreak}
                                className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                            >
                                End Break
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-4">Select a break type to start:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {breakTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => startBreak(type.id)}
                                        className="p-4 border-2 border-blue-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                                    >
                                        <h4 className="font-bold text-blue-900">{type.name}</h4>
                                        <p className="text-sm text-gray-500">{type.duration / 60} mins</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Recent Breaks</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-3 text-gray-600">Type</th>
                                    <th className="pb-3 text-gray-600">Start Time</th>
                                    <th className="pb-3 text-gray-600">End Time</th>
                                    <th className="pb-3 text-gray-600">Status</th>
                                    <th className="pb-3 text-gray-600">Violation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 5).map(session => (
                                    <tr key={session.id} className="border-b last:border-0">
                                        <td className="py-3">{session.breakType.name}</td>
                                        <td className="py-3">{new Date(session.startTime).toLocaleTimeString()}</td>
                                        <td className="py-3">{session.endTime ? new Date(session.endTime).toLocaleTimeString() : '-'}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${session.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-red-500">
                                            {session.violationDuration ? `+${Math.floor(session.violationDuration / 60)}m ${session.violationDuration % 60}s` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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

export default UserDashboard;
