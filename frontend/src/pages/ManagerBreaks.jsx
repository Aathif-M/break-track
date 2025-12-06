import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit } from 'lucide-react';
import LoadingComponent from '../components/LoadingComponent';

const ManagerBreaks = () => {
    const [breaks, setBreaks] = useState([]);
    const [isAddModalOpen, setisAddModalOpen] = useState(false);
    const [isEditModalOpen, setisEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', duration: 600 });
    const [durationSplit, setDurationSplit] = useState({ minutes: 10, seconds: 0 });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBreaks();
    }, []);

    const fetchBreaks = async () => {
        try {
            const res = await api.get('/breaks/types');
            setBreaks(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const totalSeconds = (parseInt(durationSplit.minutes) || 0) * 60 + (parseInt(durationSplit.seconds) || 0);
            const dataToSubmit = { ...formData, duration: totalSeconds };

            if (editingId) {
                await api.put(`/breaks/types/${editingId}`, dataToSubmit);
            } else {
                await api.post('/breaks/types', dataToSubmit);
            }
            setisAddModalOpen(false);
            setisEditModalOpen(false);
            setFormData({ name: '', duration: 600 });
            setDurationSplit({ minutes: 10, seconds: 0 });
            setEditingId(null);
            fetchBreaks();
        } catch (error) {
            alert('Failed to save break type');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this break type?')) {
            try {
                await api.delete(`/breaks/types/${id}`);
                fetchBreaks();
            } catch (error) {
                console.error(error);
                alert('Failed to delete break type');
            }
        }
    };

    const openEditModal = (breakType) => {
        setFormData({ name: breakType.name, duration: breakType.duration });
        setDurationSplit({
            minutes: Math.floor(breakType.duration / 60),
            seconds: breakType.duration % 60
        });
        setEditingId(breakType.id);
        setisEditModalOpen(true);
        setisAddModalOpen(false);
    };

    const openAddModal = () => {
        setFormData({ name: '', duration: 600 });
        setDurationSplit({ minutes: 10, seconds: 0 });
        setEditingId(null);
        setisAddModalOpen(true);
        setisEditModalOpen(false);
    };



    if (loading) return <LoadingComponent message="Loading breaks..." />;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Breaks</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800"
                >
                    <Plus size={20} />
                    Add New Break
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-gray-600 font-medium">Break Name</th>
                                <th className="p-4 text-gray-600 font-medium">Duration</th>
                                <th className="p-4 text-gray-600 font-medium">Status</th>
                                <th className="p-4 text-gray-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breaks.map(bt => (
                                <tr key={bt.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 font-medium">{bt.name}</td>
                                    <td className="p-4 text-gray-600">
                                        {Math.floor(bt.duration / 60)}:{(bt.duration % 60).toString().padStart(2, '0')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${bt.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {bt.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => openEditModal(bt)}
                                            className="text-gray-400 hover:text-gray-600 p-2"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(bt.id)}
                                            className="text-red-400 hover:text-red-600 p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setisAddModalOpen(false)} title={editingId ? "Edit Break" : "Add New Break"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Break Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={durationSplit.minutes}
                                    onChange={e => setDurationSplit({ ...durationSplit, minutes: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Seconds</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={durationSplit.seconds}
                                    onChange={e => setDurationSplit({ ...durationSplit, seconds: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                    >
                        {editingId ? "Update Break" : "Add Break"}
                    </button>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setisEditModalOpen(false)} title={editingId ? "Edit Break" : "Edit Break"}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Break Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Minutes</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={durationSplit.minutes}
                                    onChange={e => setDurationSplit({ ...durationSplit, minutes: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500">Seconds</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={durationSplit.seconds}
                                    onChange={e => setDurationSplit({ ...durationSplit, seconds: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                    >
                        {editingId ? "Update Break" : "Add Break"}
                    </button>
                </form>
            </Modal>
        </div >
    );


};

export default ManagerBreaks;
