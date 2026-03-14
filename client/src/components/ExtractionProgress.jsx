import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ExtractionProgress({ progress, statusMessage, mode }) {

    // Evaluate steps dynamically based on progress
    const steps = [
        { id: 1, label: 'Fetching Source', progressRange: [0, 10] },
        { id: 2, label: 'Decoding Frames', progressRange: [10, 50] },
        { id: 3, label: `Applying AI Vision (${mode === 'slide' ? 'Slide' : mode === 'board' ? 'Board' : 'Interval'} Filter)`, progressRange: [50, 90] },
        { id: 4, label: 'Consolidating Extracts', progressRange: [90, 100] }
    ];

    return (
        <div className="glass-card max-w-2xl mx-auto p-8 relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 text-center text-white">
                Processing timeline
            </h2>

            <div className="space-y-6">
                {steps.map((step) => {
                    const isActive = progress >= step.progressRange[0] && progress < step.progressRange[1] && progress < 100;
                    const isDone = progress >= step.progressRange[1] || progress === 100;

                    return (
                        <div key={step.id} className="relative">
                            <div className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'opacity-100 scale-105 transform pb-2' : isDone ? 'opacity-50' : 'opacity-20 translate-x-2'}`}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-lg relative">
                                    {isActive && <div className="absolute inset-0 bg-accent-500/20 blur-md rounded-full animate-pulse" />}

                                    {isDone ? (
                                        <CheckCircle2 size={22} className="text-green-400" />
                                    ) : isActive ? (
                                        <Loader2 size={20} className="text-accent-400 animate-spin" />
                                    ) : (
                                        <span className="text-sm font-mono text-gray-500 font-bold">{step.id}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {step.label}
                                    </h3>
                                    {isActive && statusMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            className="text-xs text-accent-300 mt-1 truncate max-w-sm"
                                        >
                                            {statusMessage}
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 relative">
                <div className="flex justify-between text-xs font-mono font-bold mb-2 uppercase tracking-widest text-gray-400">
                    <span>Overall Progress</span>
                    <span className={progress === 100 ? 'text-green-400' : 'text-accent-400'}>{progress}%</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-3 overflow-hidden border border-white/5 relative">
                    <motion.div
                        className={`h-full relative overflow-hidden ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-accent-600 to-blue-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.5 }}
                    >
                        {progress < 100 && (
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
                        )}
                    </motion.div>
                </div>
            </div>

            {progress < 100 && (
                <p className="text-center text-xs mt-6 text-gray-500 animate-pulse">
                    Please keep this window open while processing...
                </p>
            )}
        </div>
    );
}
