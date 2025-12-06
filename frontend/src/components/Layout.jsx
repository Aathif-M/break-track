import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import metaLogoWhite from '../assets/meta-logo-white.png';

const Layout = ({ children, navLinks }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuth();

    const handleNavClick = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-blue-900 text-white p-4 flex justify-between items-center z-30 shadow-md h-16">
                <h1 className="text-xl font-bold">WorkPulse</h1>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 focus:outline-none">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen w-64 bg-blue-900 text-white p-6 flex flex-col transition-transform duration-300 z-30
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="pb-6 mb-3 hidden md:block border-b border-blue-800">
                    <img src={metaLogoWhite} alt="WorkPulse Logo" className="h-16 mb-0" />
                    <h1 className="text-2xl font-bold">WorkPulse</h1>
                </div>

                {/* Mobile Header Spacer */}
                <div className="md:hidden h-10 mb-6 flex items-center">
                    <span className="text-lg font-semibold">Menu</span>
                </div>

                <nav className="flex-1 space-y-2" onClick={handleNavClick}>
                    {navLinks}
                </nav>

                <div className="mt-auto pt-6 border-t border-blue-800">
                    <div className="mb-4 text-sm text-blue-200">
                        Logged in as: <br />
                        <span className="font-bold text-white">{user?.name}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full bg-blue-700 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-gray-50 pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
};

export default Layout;
