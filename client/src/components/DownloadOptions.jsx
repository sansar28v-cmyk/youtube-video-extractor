import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Trash2, Archive, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DownloadOptions({ sessionId, title, count }) {
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);

    const downloadZip = () => {
        const link = document.createElement('a');
        link.href = `/api/download/zip/${sessionId}`;
        link.download = `${title || 'screenshots'}.zip`;
        link.click();
        toast.success('Downloading ZIP…');
    };

    const downloadPdf = () => {
        const link = document.createElement('a');
        link.href = `/api/download/pdf/${sessionId}`;
        link.download = `${title || 'screenshots'}.pdf`;
        link.click();
        toast.success('Generating PDF…');
    };

    const handleDelete = async () => {
        if (!confirm('Delete all screenshots for this session?')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleted(true);
                toast.success('Session deleted.');
            } else {
                toast.error('Failed to delete session.');
            }
        } catch {
            toast.error('Error deleting session.');
        } finally {
            setDeleting(false);
        }
    };

    if (deleted) {
        return (
            <div className="glass-card p-6 text-center">
                <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                <p className="font-semibold text-white">Session cleaned up.</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 shadow-2xl shadow-black/20">
            <h2 className="section-title flex items-center gap-2.5 mb-5">
                <Download size={20} className="text-accent-400" />
                Download options
                <span className="tag ml-auto">{count} screenshots</span>
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
                <motion.button
                    id="download-zip-btn"
                    onClick={downloadZip}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 text-left"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/15">
                        <Archive size={22} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm text-white mb-0.5">Download ZIP</p>
                        <p className="text-xs text-gray-400">All frames in a folder</p>
                    </div>
                </motion.button>

                <motion.button
                    id="download-pdf-btn"
                    onClick={downloadPdf}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 text-left"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-500/15">
                        <FileText size={22} className="text-accent-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm text-white mb-0.5">Export PDF</p>
                        <p className="text-xs text-gray-400">Chronological with timestamps</p>
                    </div>
                </motion.button>

                <motion.button
                    id="delete-session-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all duration-200 text-left"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10">
                        <Trash2 size={22} className="text-red-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm text-red-400 mb-0.5">
                            {deleting ? 'Deleting…' : 'Delete session'}
                        </p>
                        <p className="text-xs text-gray-400">Remove temp files</p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
