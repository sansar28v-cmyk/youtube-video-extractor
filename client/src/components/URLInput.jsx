import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';

export default function URLInput({ url, setUrl, onFetch, onReset, appState, videoInfo }) {
    const isLoading = appState === 'loading';

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = url.trim();
        if (trimmed && appState === 'idle') {
            onFetch(trimmed);
        } else if (appState !== 'idle') {
            onReset();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group z-20">
            <div className="absolute inset-0 bg-accent-600/20 blur-3xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex items-center bg-dark-900/90 backdrop-blur-2xl rounded-2xl p-2.5 border border-white/10 transition-all duration-300 group-hover:border-white/20 group-focus-within:border-accent-500/40">
                <Search size={20} className="ml-4 mr-3 text-gray-500 group-hover:text-accent-400 transition-colors shrink-0" />
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube URL (lecture, talk, tutorial…)"
                    disabled={appState !== 'idle' && appState !== 'error'}
                    className="w-full bg-transparent text-white placeholder-gray-500 py-3.5 text-base outline-none selection:bg-accent-500/30"
                />
                <button
                    type="submit"
                    disabled={(!url && appState === 'idle') || isLoading}
                    className={`ml-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center min-w-[140px] shrink-0
                        ${(appState !== 'idle' && appState !== 'error')
                            ? 'bg-dark-700 text-gray-300 hover:bg-dark-600 border border-white/10'
                            : 'btn-neon text-white'
                        }`}
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 text-white" />
                        : (appState !== 'idle' && appState !== 'error') ? 'Reset' : 'Analyze'}
                </button>
            </div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: (appState === 'idle' || appState === 'error') ? 1 : 0 }}
                className="text-center mt-3 text-sm text-gray-500"
            >
                Videos, Shorts, and archived streams supported.
            </motion.p>
        </form>
    );
}
