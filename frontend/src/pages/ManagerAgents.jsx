import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Trash2, RotateCcw, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ManagerAgents = () => {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'AGENT' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await api.get('/users');
            setAgents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/users/${editingId}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setIsModalOpen(false);
            setFormData({ name: '', email: '', role: 'AGENT' });
            setEditingId(null);
            fetchAgents();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchAgents();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleResetPassword = async (id) => {
        if (window.confirm('Are you sure you want to reset the password to default (meta@147)?')) {
            try {
                await api.put(`/users/${id}/reset-password`);
                alert('Password reset successfully');
            } catch (error) {
                console.error(error);
                alert('Failed to reset password');
            }
        }
    };

    const handleEdit = (agent) => {
        setFormData({ name: agent.name, email: agent.email, role: agent.role });
        setEditingId(agent.id);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', role: 'AGENT' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-gray-600 font-medium">ID</th>
                            <th className="p-4 text-gray-600 font-medium">Name</th>
                            <th className="p-4 text-gray-600 font-medium">Email</th>
                            <th className="p-4 text-gray-600 font-medium">Role</th>
                            <th className="p-4 text-gray-600 font-medium">Created By</th>
                            <th className="p-4 text-gray-600 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 text-gray-500">#{agent.id.toString().padStart(3, '0')}</td>
                                <td className="p-4 font-medium">{agent.name}</td>
                                <td className="p-4 text-gray-600">{agent.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${agent.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {agent.role}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{agent.createdBy?.name || '-'}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleResetPassword(agent.id)}
                                        className="text-blue-500 hover:text-blue-700 p-2"
                                        title="Reset Password"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(agent)}
                                        className="text-gray-500 hover:text-gray-700 p-2"
                                        title="Edit User"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit User" : "Add New User"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>


                    {user.role === 'SUPER_ADMIN' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="AGENT">Agent</option>
                                <option value="MANAGER">Manager</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                    >
                        {editingId ? "Update User" : "Add User"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default ManagerAgents;
