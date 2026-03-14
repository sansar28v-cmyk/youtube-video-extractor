export default function VideoPlayer({ videoId, title }) {
    if (!videoId) return null;

    return (
        <div className="glass-card overflow-hidden border border-white/5 rounded-2xl">
            <div className="relative w-full aspect-video">
                <iframe
                    id="youtube-player"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={title || 'YouTube video preview'}
                    className="absolute inset-0 w-full h-full rounded-xl"
                    style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            <div className="p-4 border-t border-white/5">
                <p className="text-sm font-medium truncate text-gray-400">
                    Preview — {title}
                </p>
            </div>
        </div>
    );
}
