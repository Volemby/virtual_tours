import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ToursGrid from './components/ToursGrid';
import UploadModal from './components/UploadModal';

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

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

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-105 active:scale-95 font-medium text-sm rounded-full transition-all shadow-xl shadow-white/5"
                    >
                        <Plus className="w-4 h-4" />
                        Upload Tour
                    </button>
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
