import { motion } from 'framer-motion';
import { Camera, Layers, Play, Zap, Monitor, PenTool, Hash } from 'lucide-react';

const MODES = [
    { id: 'slide', label: 'Slide Mode', icon: Monitor, desc: 'For Presentations' },
    { id: 'board', label: 'Board Mode', icon: PenTool, desc: 'For Whiteboards' },
    { id: 'interval', label: 'Interval Mode', icon: Hash, desc: 'Fixed Timing' },
];

export default function SettingsPanel({ settings, setSettings, videoInfo, onExtract, disabled }) {
    return (
        <div className="glass-card flex flex-col gap-6 shadow-2xl shadow-black/20">
            <h2 className="text-lg font-bold flex items-center gap-2.5 text-white">
                <span className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center ring-1 ring-white/5">
                    <Camera size={20} className="text-accent-400" />
                </span>
                Extraction configuration
            </h2>

            {/* Mode Selection */}
            <div>
                <label className="text-xs font-semibold uppercase tracking-widest mb-3 block text-gray-400">
                    Detection Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {MODES.map((m) => {
                        const Icon = m.icon;
                        const isActive = settings.mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSettings({ ...settings, mode: m.id })}
                                className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${isActive
                                        ? 'border-accent-500 bg-accent-500/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={24} className={isActive ? 'text-accent-400' : ''} />
                                <div className="text-center">
                                    <div className="text-sm font-bold">{m.label}</div>
                                    <div className="text-[10px] opacity-70 mt-0.5">{m.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Settings */}
            <div className="bg-dark-900/50 p-5 rounded-2xl border border-white/5">
                <label className="text-xs font-semibold uppercase tracking-widest mb-3 block text-gray-400">
                    Capture interval (3 sec – 10 min)
                </label>
                {/* Presets: 3s, 5s, 10s + then minutes */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[3, 5, 10, 30, 60, 120, 300, 600].map((sec) => (
                        <button
                            key={sec}
                            type="button"
                            onClick={() => setSettings({ ...settings, interval: sec })}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                settings.interval === sec
                                    ? 'bg-accent-500/20 border-accent-500/50 text-accent-300'
                                    : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5'
                            }`}
                        >
                            {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-500 shrink-0">Custom:</span>
                    <input
                        type="number"
                        min={3}
                        max={600}
                        value={settings.interval}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) setSettings({ ...settings, interval: Math.max(3, Math.min(600, v)) });
                        }}
                        className="input-cinematic w-24 py-2 text-center text-sm font-mono tabular-nums"
                    />
                    <span className="text-xs text-gray-500">sec</span>
                    <input
                        type="range"
                        min="3"
                        max="600"
                        step="1"
                        value={settings.interval}
                        onChange={(e) => setSettings({ ...settings, interval: parseInt(e.target.value) })}
                        className="flex-1 min-w-[100px] h-2.5 rounded-full appearance-none bg-dark-700 accent-accent-500 cursor-pointer"
                    />
                    <div className="w-24 h-10 bg-dark-800 rounded-xl flex items-center justify-center border border-white/10 font-mono text-sm font-bold text-accent-400 tabular-nums shrink-0">
                        {settings.interval >= 60 ? `${(settings.interval / 60).toFixed(1)} min` : `${settings.interval}s`}
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {settings.mode === 'interval'
                        ? `One frame every ${settings.interval >= 60 ? `${(settings.interval / 60).toFixed(1)} min` : `${settings.interval}s`}.`
                        : 'Smart modes analyze every 1s and keep unique slides/boards only.'}
                </p>
            </div>

            {/* Smart Detection Toggle (Visual only, controlled by mode) */}
            <div className="flex items-center justify-between bg-dark-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${settings.mode !== 'interval' ? 'bg-accent-500/20 text-accent-400' : 'bg-white/5 text-gray-500'}`}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-sm">Smart Target Detection</div>
                        <div className="text-xs text-gray-400 mt-0.5">Filter blanks & identical frames</div>
                    </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${settings.mode !== 'interval' ? 'bg-accent-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.mode !== 'interval' ? 'left-7' : 'left-1'}`} />
                </div>
            </div>

            <motion.button
                onClick={onExtract}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                disabled={disabled}
                className="btn-neon w-full py-4 text-base font-bold flex items-center justify-center gap-3 mt-2 rounded-2xl"
            >
                <Play size={20} className="fill-current" />
                Start extraction
            </motion.button>
        </div>
    );
}
