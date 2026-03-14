import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function Header({ theme, onToggleTheme }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-0 z-40 border-b"
            style={{
                background: 'rgba(5,5,8,0.8)',
                backdropFilter: 'blur(20px)',
                borderColor: 'var(--border)',
            }}
        >
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl font-bold bg-gradient-to-br from-accent-500 via-blue-500 to-fuchsia-500 shadow-lg shadow-accent-500/30">
                        ST
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display font-semibold text-lg leading-tight">
                            <span className="gradient-text-accent">Slide Extractor</span>
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
                            AI YOUTUBE CAPTURE STUDIO
                        </span>
                    </div>
                </div>

                {/* Right buttons */}
                <div className="flex items-center gap-2">
                    <motion.button
                        id="theme-toggle"
                        onClick={onToggleTheme}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-ghost flex items-center gap-2 text-sm"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark'
                            ? <Sun size={16} className="text-yellow-400" />
                            : <Moon size={16} className="text-indigo-400" />}
                        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
}
