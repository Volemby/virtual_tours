import React, { useState } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import client from '../api/client';

export default function UploadModal({ isOpen, onClose, onUploadSuccess, initialData }) {
    const [tourId, setTourId] = useState('');
    const [tourZip, setTourZip] = useState(null);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const [progress, setProgress] = useState(0);

    const isEditing = !!initialData;

    // Initialize state when initialData changes
    // We use a key or this effect pattern. Since the modal is conditionally rendered in App with isOpen, 
    // actually we should rely on the component remounting or state sync. 
    // Given App.jsx renders <UploadModal ... initialData={editingTour} />, if we close it destroys?
    // Let's assume it might not if purely CSS hidden, but App.jsx uses:
    // { isModalOpen && <UploadModal ... /> } ? No, it passes isOpen prop. 
    // So the component stays mounted but hidden/shown? 
    // Checking App.jsx: <UploadModal isOpen={isModalOpen} ... />
    // It's always mounted. So we need useEffect to sync state when isOpen or initialData changes.
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTourId(initialData.id);
                setTourZip(null); // Reset files
                setCoverPhoto(null);
            } else {
                setTourId('');
                setTourZip(null);
                setCoverPhoto(null);
            }
            setError(null);
            setProgress(0);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!tourId) {
            setError("Tour ID is required");
            return;
        }
        if (!isEditing && (!tourZip || !coverPhoto)) {
            setError("All fields are required for new tours");
            return;
        }

        const formData = new FormData();
        // For edit, we might send 'newTourId' if it changed
        if (isEditing) {
            if (tourId !== initialData.id) {
                formData.append('newTourId', tourId);
            }
        } else {
            formData.append('tourId', tourId);
        }

        if (tourZip) formData.append('tourZip', tourZip);
        if (coverPhoto) formData.append('coverPhoto', coverPhoto);

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            };

            if (isEditing) {
                await client.put(`/tours/${initialData.id}`, formData, config);
            } else {
                await client.post('/tours/', formData, config);
            }

            onUploadSuccess();
            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            if (err.response) {
                if (err.response.status === 413) {
                    setError("File is too large. Maximum size is 200MB.");
                } else if (err.response.data && err.response.data.detail) {
                    setError(err.response.data.detail);
                } else {
                    setError(`Upload failed (${err.response.status})`);
                }
            } else if (err.request) {
                setError("Network error. Please check your connection.");
            } else {
                setError("Upload failed. Please try again.");
            }
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-white">
                        {isEditing ? 'Edit Virtual Tour' : 'New Virtual Tour'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-300">Tour ID</label>
                        <input
                            type="text"
                            value={tourId}
                            onChange={(e) => setTourId(e.target.value)}
                            placeholder="e.g. kinsky-palace-2024"
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-zinc-500"
                            pattern="[a-zA-Z0-9_-]+"
                            title="Only letters, numbers, hyphens and underscores allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-300">
                            Tour ZIP File {isEditing && <span className="text-zinc-500 font-normal">(Optional)</span>}
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".zip"
                                onChange={(e) => setTourZip(e.target.files[0])}
                                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer border border-zinc-800 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-300">
                            Cover Photo {isEditing && <span className="text-zinc-500 font-normal">(Optional)</span>}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverPhoto(e.target.files[0])}
                            className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer border border-zinc-800 rounded-lg"
                        />
                    </div>

                    {uploading ? (
                        <div className="w-full mt-6 bg-zinc-800 rounded-lg overflow-hidden h-10 relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm drop-shadow-md">
                                {isEditing ? 'Updating...' : 'Uploading...'} {progress}%
                            </div>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-4 h-4" />
                            {isEditing ? 'Update Tour' : 'Upload Tour'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
