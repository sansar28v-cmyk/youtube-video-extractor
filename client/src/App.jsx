import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Header from './components/Header';
import URLInput from './components/URLInput';
import VideoPlayer from './components/VideoPlayer';
import SettingsPanel from './components/SettingsPanel';
import ExtractionProgress from './components/ExtractionProgress';
import Gallery from './components/Gallery';
import DownloadOptions from './components/DownloadOptions';
import StudySummary from './components/StudySummary';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function App() {
    const [theme, setTheme] = useState('dark');
    const [url, setUrl] = useState('');
    const [videoInfo, setVideoInfo] = useState(null);
    const [videoId, setVideoId] = useState(null);
    const [settings, setSettings] = useState({ mode: 'slide', interval: 10 });
    const [appState, setAppState] = useState('idle'); // idle | loading | ready | extracting | complete | error
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [screenshots, setScreenshots] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [backendOk, setBackendOk] = useState(null); // null = checking, true = ok, false = not running

    useEffect(() => {
        const el = document.documentElement;
        if (theme === 'dark') el.classList.add('dark');
        else el.classList.remove('dark');
    }, [theme]);

    useEffect(() => {
        let cancelled = false;
        fetch('/health')
            .then((r) => r.text())
            .then((text) => {
                if (cancelled) return;
                try {
                    const d = text ? JSON.parse(text) : {};
                    setBackendOk(d?.status === 'ok');
                } catch {
                    setBackendOk(false);
                }
            })
            .catch(() => { if (!cancelled) setBackendOk(false); });
        return () => { cancelled = true; };
    }, []);

    const extractVideoId = (ytUrl) => {
        const m = ytUrl.match(/[?&]v=([\w-]{11})/) || ytUrl.match(/youtu\.be\/([\w-]{11})/);
        return m ? m[1] : null;
    };

    const backendUnavailableMsg = 'Backend not running. In the project folder open "server", run: npm run dev';

    const handleFetchInfo = useCallback(async (ytUrl) => {
        setAppState('loading');
        setErrorMsg('');
        setVideoInfo(null);
        setScreenshots([]);
        setSessionId(null);
        try {
            const res = await fetch(`/api/video-info?url=${encodeURIComponent(ytUrl)}`);
            let text;
            try {
                text = await res.text();
            } catch (e) {
                throw new Error(backendUnavailableMsg);
            }
            if (!text || !text.trim()) {
                throw new Error(backendUnavailableMsg);
            }
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(backendUnavailableMsg);
            }
            if (!res.ok) throw new Error(data.error || 'Failed to fetch video info');
            setVideoInfo(data);
            setVideoId(extractVideoId(ytUrl));
            setAppState('ready');
            toast.success('Video initialized', { icon: '🎬' });
        } catch (err) {
            let message = err?.message || 'Failed to fetch video info';
            if (message.includes('json') || message.includes('JSON') || message.includes('fetch') || message.includes('Network') || message.includes('Connection') || message.includes('refused')) {
                message = backendUnavailableMsg;
            }
            setErrorMsg(message);
            setAppState('error');
            toast.error(message);
        }
    }, []);

    const handleExtract = useCallback(async () => {
        setAppState('extracting');
        setProgress(0);
        setScreenshots([]);
        setSessionId(null);
        setStatusMessage('Connecting to AI Engine…');

        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, interval: settings.interval, mode: settings.mode }),
            });
            if (!res.ok) {
                const text = await res.text();
                let d = {};
                try { d = text ? JSON.parse(text) : {}; } catch (_) {}
                throw new Error(d.error || text || 'Extraction failed');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    let evt;
                    try { evt = JSON.parse(line.slice(6)); } catch (_) { continue; }
                    if (evt.type === 'session') setSessionId(evt.sessionId);
                    else if (evt.type === 'status') setStatusMessage(evt.message);
                    else if (evt.type === 'progress' || evt.type === 'processing') {
                        setProgress(evt.percent || 0);
                        if (evt.message) setStatusMessage(evt.message);
                    } else if (evt.type === 'complete') {
                        setProgress(100);
                        setScreenshots(evt.screenshots || []);
                        setSessionId(evt.sessionId);
                        setAppState('complete');
                        toast.success(`Success: ${evt.totalCount} captures completed`);
                    } else if (evt.type === 'error') {
                        setErrorMsg(evt.message);
                        setAppState('error');
                        toast.error(evt.message);
                    }
                }
            }
        } catch (err) {
            let message = err?.message || 'Extraction failed';
            if (message.includes('json') || message.includes('JSON') || message.includes('fetch') || message.includes('Network') || message.includes('Connection') || message.includes('refused')) {
                message = backendUnavailableMsg;
            }
            setErrorMsg(message);
            setAppState('error');
            toast.error(message);
        }
    }, [url, settings]);

    const handleReset = () => {
        setAppState('idle');
        setUrl('');
        setVideoInfo(null);
        setVideoId(null);
        setScreenshots([]);
        setSessionId(null);
        setProgress(0);
        setErrorMsg('');
        setStatusMessage('');
    };

    return (
        <div className={`min-h-screen relative text-white transition-colors duration-300 ${theme === 'light' ? 'light' : ''}`}>
            {/* Animated bg */}
            <div className="animated-bg" />

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-14 md:space-y-16 relative z-10">
                {/* Hero */}
                <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center pt-6 pb-2">
                    <span className="tag-shiny mb-5 border-accent-500/30 text-accent-300">
                        Custom intervals · AI study summary · 1080p
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
                        <span className="gradient-text-accent">Slide Extractor</span>
                    </h1>
                    <p className="text-lg max-w-xl mx-auto text-gray-400 font-normal hidden md:block leading-relaxed">
                        Extract slides from lectures, choose any interval (10s–10min), then get a study summary to learn faster.
                    </p>
                </motion.div>

                {/* Backend offline warning */}
                {backendOk === false && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3"
                    >
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-amber-200">Backend not running</p>
                            <p className="text-sm text-amber-200/80 mt-0.5">
                                Open a terminal, go to the <strong>server</strong> folder, then run: <code className="bg-black/30 px-1.5 py-0.5 rounded">npm run dev</code>
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* URL Input */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ transitionDelay: '0.1s' }}>
                    <URLInput
                        url={url}
                        setUrl={setUrl}
                        onFetch={handleFetchInfo}
                        onReset={handleReset}
                        appState={appState}
                        videoInfo={videoInfo}
                    />
                </motion.div>

                {/* Error */}
                <AnimatePresence mode="wait">
                    {appState === 'error' && errorMsg && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit"
                            className="glass-panel p-5 border-red-500/30 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                ⚠️
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-red-400 mb-0.5">Processing error</p>
                                <p className="text-sm text-gray-400 break-words">{errorMsg}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Video Player + Settings */}
                <AnimatePresence mode="wait">
                    {(appState === 'ready' || appState === 'complete') && videoId && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit"
                            className="grid lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-7">
                                <VideoPlayer videoId={videoId} title={videoInfo?.title} />
                            </div>
                            <div className="lg:col-span-5 flex flex-col h-full">
                                <SettingsPanel
                                    settings={settings}
                                    setSettings={setSettings}
                                    videoInfo={videoInfo}
                                    onExtract={handleExtract}
                                    disabled={appState !== 'ready'}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Extraction Progress */}
                <AnimatePresence mode="wait">
                    {appState === 'extracting' && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <ExtractionProgress progress={progress} statusMessage={statusMessage} mode={settings.mode} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Download Options */}
                <AnimatePresence mode="wait">
                    {appState === 'complete' && sessionId && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <DownloadOptions sessionId={sessionId} title={videoInfo?.title} count={screenshots.length} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Study Summary for students */}
                <AnimatePresence mode="wait">
                    {appState === 'complete' && sessionId && screenshots.length > 0 && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <StudySummary sessionId={sessionId} title={videoInfo?.title} screenshots={screenshots} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Gallery */}
                <AnimatePresence mode="wait">
                    {appState === 'complete' && screenshots.length > 0 && (
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                            <Gallery screenshots={screenshots} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
