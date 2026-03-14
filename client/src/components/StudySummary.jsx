import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, Sparkles, Clock } from 'lucide-react';

export default function StudySummary({ sessionId, title, screenshots }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const keyMoments = (screenshots || []).map((s) => ({
        time: s.timestampStr,
        seconds: s.timestamp,
    }));

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (!res.ok) throw new Error(data.error || 'Failed to load summary');
            setSummary(data);
        } catch (err) {
            setError(err?.message || 'Could not load summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2.5 mb-5">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <BookOpen size={20} className="text-emerald-400" />
                </span>
                <div>
                    <h2 className="section-title">AI Smart Summarize</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Key moments & smart video summary for easy learning</p>
                </div>
            </div>

            {/* Key moments */}
            <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                    <Clock size={12} /> Key moments
                </h3>
                <div className="flex flex-wrap gap-2">
                    {keyMoments.slice(0, 20).map((m, i) => (
                        <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-300"
                        >
                            {m.time}
                        </span>
                    ))}
                    {keyMoments.length > 20 && (
                        <span className="px-3 py-1.5 text-xs text-gray-500">+{keyMoments.length - 20} more</span>
                    )}
                </div>
            </div>

            {!summary && !loading && (
                <motion.button
                    onClick={fetchSummary}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                >
                    <Sparkles size={18} />
                    AI Smart Summarize video
                </motion.button>
            )}

            {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Generating summary…</span>
                </div>
            )}

            {error && (
                <p className="text-sm text-amber-400 py-2">
                    {error}
                    {error.includes('Session') ? ' Summary uses key moments only until extraction is saved.' : ''}
                </p>
            )}

            {summary?.aiSummary && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                        <Sparkles size={12} /> AI Smart Summary
                    </h3>
                    <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {summary.aiSummary}
                    </div>
                </motion.div>
            )}

            {summary && !summary.aiSummary && !error && (
                <p className="text-sm text-gray-500 mt-2">
                    Set <code className="bg-black/30 px-1 rounded">OPENAI_API_KEY</code> in the server to enable AI Smart Summarize.
                </p>
            )}
        </div>
    );
}
