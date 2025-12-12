import React, { useState, useEffect } from 'react';
import { Plus, LogOut } from 'lucide-react';
import axios from 'axios';
import ToursGrid from './components/ToursGrid';
import UploadModal from './components/UploadModal';
import Login from './components/Login';

// Configure axios defaults
axios.defaults.withCredentials = true;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            await axios.get('/api/v1/auth/me');
            setIsAuthenticated(true);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/v1/auth/logout');
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">

            <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
                            VT
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight">Virtual Tours Manager</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-105 active:scale-95 font-medium text-sm rounded-full transition-all shadow-xl shadow-white/5"
                        >
                            <Plus className="w-4 h-4" />
                            Upload Tour
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                            title="Sign out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Gallery
                    </h2>
                    <p className="text-zinc-400 mt-1">Manage and view your virtual tour collection</p>
                </div>

                <ToursGrid refreshTrigger={refreshTrigger} />
            </main>

            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
}

export default App;
