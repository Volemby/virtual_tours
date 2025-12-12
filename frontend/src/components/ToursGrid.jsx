import React, { useEffect, useState } from 'react';
import { Trash2, ExternalLink, Pencil } from 'lucide-react';
import client from '../api/client';

export default function ToursGrid({ refreshTrigger, onEdit }) {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTours = async () => {
        try {
            const { data } = await client.get('/tours/');
            setTours(data);
        } catch (error) {
            console.error("Failed to fetch tours", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, [refreshTrigger]);

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete tour ${id}?`)) return;
        try {
            await client.delete(`/tours/${id}`);
            fetchTours();
        } catch (error) {
            alert("Failed to delete tour");
        }
    };

    if (loading) {
        return <div className="text-zinc-500 text-center py-12">Loading tours...</div>;
    }

    if (tours.length === 0) {
        return (
            <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                <p className="text-zinc-500">No tours found. Upload one to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tours.map((tour) => (
                <div key={tour.id} className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all hover:shadow-xl">
                    <div className="aspect-video relative bg-zinc-950 overflow-hidden">
                        {tour.coverUrl ? (
                            <img src={tour.coverUrl} alt={tour.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                                No Cover
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                            <a
                                href={tour.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur text-xs font-semibold text-white rounded-full flex items-center gap-1.5 transition-colors"
                            >
                                View <ExternalLink className="w-3 h-3" />
                            </a>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(tour)}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-full transition-colors"
                                    title="Edit Tour"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tour.id)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                                    title="Delete Tour"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <h3 className="text-white font-medium truncate" title={tour.name}>{tour.name}</h3>
                        <p className="text-zinc-500 text-xs mt-1 font-mono uppercase tracking-wider">{tour.id}</p>
                    </div>
                </div>
            ))
            }
        </div >
    );
}
