import React, { useState } from 'react';
import { X, Upload, Loader2, AlertCircle } from 'lucide-react';
import client from '../api/client';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
    const [tourId, setTourId] = useState('');
    const [tourZip, setTourZip] = useState(null);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tourId || !tourZip || !coverPhoto) {
            setError("All fields are required");
            return;
        }

        const formData = new FormData();
        formData.append('tourId', tourId);
        formData.append('tourZip', tourZip);
        formData.append('coverPhoto', coverPhoto);

        setUploading(true);
        setError(null);

        try {
            await client.post('/tours/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onUploadSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-white">New Virtual Tour</h2>
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
                        <label className="text-sm font-medium text-zinc-300">Tour ZIP File</label>
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
                        <label className="text-sm font-medium text-zinc-300">Cover Photo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverPhoto(e.target.files[0])}
                            className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer border border-zinc-800 rounded-lg"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload Tour
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
