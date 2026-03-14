import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const stagger = {
    visible: { transition: { staggerChildren: 0.04 } },
};
const item = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

function Lightbox({ screenshots, index, onClose, onPrev, onNext }) {
    const shot = screenshots[index];
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-4xl w-full"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={shot.url}
                    alt={`Screenshot ${shot.timestampStr}`}
                    className="w-full rounded-2xl shadow-2xl"
                />
                {/* Controls */}
                <button onClick={onClose}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Close">
                    <X size={18} className="text-white" />
                </button>
                {index > 0 && (
                    <button onClick={onPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Previous">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                )}
                {index < screenshots.length - 1 && (
                    <button onClick={onNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Next">
                        <ChevronRight size={20} className="text-white" />
                    </button>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs text-white font-medium"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <Clock size={11} className="inline mr-1" />{shot.timestampStr} &nbsp;·&nbsp; {index + 1} / {screenshots.length}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function Gallery({ screenshots }) {
    const [lightboxIdx, setLightboxIdx] = useState(null);

    return (
        <div className="glass-card p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="section-title flex items-center gap-2.5">
                    <span className="text-xl">Screenshot gallery</span>
                    <span className="tag">{screenshots.length} frames</span>
                </h2>
            </div>

            <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
                {screenshots.map((shot, idx) => (
                    <motion.div
                        key={shot.filename}
                        variants={item}
                        id={`screenshot-${idx}`}
                        className="group relative cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-dark-800/50 aspect-[16/9]"
                        onClick={() => setLightboxIdx(idx)}
                        whileHover={{ scale: 1.04, zIndex: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <img
                            src={shot.url}
                            alt={`Frame at ${shot.timestampStr}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex items-center gap-1 text-white text-xs font-semibold">
                                <Clock size={10} />{shot.timestampStr}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && (
                    <Lightbox
                        screenshots={screenshots}
                        index={lightboxIdx}
                        onClose={() => setLightboxIdx(null)}
                        onPrev={() => setLightboxIdx(i => Math.max(0, i - 1))}
                        onNext={() => setLightboxIdx(i => Math.min(screenshots.length - 1, i + 1))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
