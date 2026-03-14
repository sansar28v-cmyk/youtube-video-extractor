const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ytDlp = require('yt-dlp-exec');
const { compareFrames } = require('../utils/frameComparison');

ffmpeg.setFfmpegPath(ffmpegStatic);

function sanitizeName(name) {
    return (name || 'video').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim().substring(0, 80) || 'video';
}

function isValidYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]{11}/.test(url);
}

function formatTimestamp(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// POST /api/extract  → SSE stream
router.post('/extract', async (req, res) => {
    // Mode defaults to 'slide'. Can be 'slide', 'board', or 'interval'
    const { url, interval = 10, mode = 'slide' } = req.body;

    const uniqueOnly = (mode === 'slide' || mode === 'board');

    if (!url || !isValidYouTubeUrl(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    if (interval < 3 || interval > 600) {
        return res.status(400).json({ error: 'Interval must be between 3 seconds and 10 minutes (600s)' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const send = (data) => {
        try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch (_) { }
    };

    const sessionId = uuidv4();
    send({ type: 'session', sessionId });
    send({ type: 'status', message: 'Fetching video information…' });

    // 1. Get video info
    let videoInfo;
    try {
        videoInfo = await ytDlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            format: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
        });
    } catch (err) {
        send({ type: 'error', message: 'Failed to fetch video: ' + err.message });
        return res.end();
    }

    if (!videoInfo || videoInfo.duration > 7200) {
        send({ type: 'error', message: 'Video too long (max 2 hours) or unavailable.' });
        return res.end();
    }

    const folderName = sanitizeName(videoInfo.title);
    const sessionDir = path.join(__dirname, '../screenshots', sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    send({ type: 'status', message: 'Downloading & Extracting frames…' });

    const duration = videoInfo.duration || 60;
    // For smart modes, extract 1 frame per second. For interval, use given interval.
    const targetInterval = uniqueOnly ? 1 : interval;
    const expectedFrames = Math.max(1, Math.floor(duration / targetInterval));
    let frameCount = 0;

    // 2 & 3. Get stream via yt-dlp and pipe directly to FFmpeg
    const extractSuccess = await new Promise((resolve) => {
        let streamClosed = false;
        const ytdlpProcess = ytDlp.exec(url, {
            format: 'bestvideo[height<=1080][ext=mp4]/best[height<=1080][ext=mp4]/best[height<=1080]/best',
            output: '-',
            noWarnings: true,
            noCheckCertificates: true,
            quiet: true
        }, { stdio: ['ignore', 'pipe', 'ignore'] });

        ytdlpProcess.on('error', (err) => {
            if (streamClosed) return;
            streamClosed = true;
            send({ type: 'error', message: 'yt-dlp error: ' + err.message });
            resolve(false);
        });

        // Max quality: q:v 1 (best JPEG), Lanczos scaling up to 1080p
        const vf = `fps=1/${targetInterval},scale=min(1920\\,iw):min(1080\\,ih):flags=lanczos`;
        ffmpeg(ytdlpProcess.stdout)
            .outputOptions([
                '-vf', vf,
                '-q:v', '1',
                '-pix_fmt', 'yuvj420p',
                '-threads', '4',
            ])
            .output(path.join(sessionDir, 'frame_%04d.jpg'))
            .on('stderr', (line) => {
                const match = line.match(/frame=\s*(\d+)/);
                if (match) {
                    frameCount = parseInt(match[1]);
                    const pct = Math.min(90, Math.round((frameCount / expectedFrames) * 90));
                    send({ type: 'progress', percent: pct, currentFrame: frameCount, totalFrames: expectedFrames, message: `Extracting frame ${frameCount}…` });
                }
            })
            .on('end', () => {
                streamClosed = true;
                resolve(true);
            })
            .on('error', (err) => {
                if (streamClosed) return;
                streamClosed = true;
                ytdlpProcess.kill('SIGKILL');
                send({ type: 'error', message: 'FFmpeg error: ' + err.message });
                resolve(false);
            })
            .run();
    });

    if (!extractSuccess) return res.end();

    // 4. Read frames and optionally filter unique ones
    send({ type: 'status', message: uniqueOnly ? `Detecting unique content (${mode} mode)…` : 'Processing frames…' });

    let files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jpg')).sort();
    let keptFiles = [];

    if (uniqueOnly && files.length > 1) {
        let prevPath = null;
        let lastSavedSecond = 0;

        for (let i = 0; i < files.length; i++) {
            const fp = path.join(sessionDir, files[i]);
            const frameIdx = parseInt(files[i].replace('frame_', '').replace('.jpg', '')) - 1;
            const currentSecond = frameIdx * targetInterval;

            if (prevPath === null) {
                keptFiles.push(files[i]);
                prevPath = fp;
                lastSavedSecond = currentSecond;
            } else {
                const timeSinceLastSave = currentSecond - lastSavedSecond;
                let isDiff = false;

                if (timeSinceLastSave >= 25) {
                    isDiff = true; // Backup rule: max 25 seconds between saves
                } else {
                    isDiff = await compareFrames(prevPath, fp, { mode, cropFactor: 0.7 });
                }

                if (isDiff) {
                    keptFiles.push(files[i]);
                    prevPath = fp;
                    lastSavedSecond = currentSecond;
                } else {
                    try { fs.unlinkSync(fp); } catch (_) { }
                }
            }
            const pct = 90 + Math.round((i / files.length) * 9);
            send({ type: 'progress', percent: pct, message: `Analyzing frame ${i + 1} / ${files.length}…` });
        }
    } else {
        keptFiles = files;
    }

    // 5. Build screenshot list & rename files
    const screenshots = [];
    let slideIdx = 1;
    for (const filename of keptFiles) {
        const frameIdx = parseInt(filename.replace('frame_', '').replace('.jpg', '')) - 1;
        const timestamp = frameIdx * targetInterval;
        const timeStr = formatTimestamp(timestamp);
        const safeTimeStr = timeStr.replace(/:/g, '-');

        const newFilename = `slide_${String(slideIdx).padStart(2, '0')}_${safeTimeStr}.jpg`;
        const oldFp = path.join(sessionDir, filename);
        const newFp = path.join(sessionDir, newFilename);

        try { fs.renameSync(oldFp, newFp); } catch (e) { }

        screenshots.push({
            filename: newFilename,
            originalFrame: filename,
            timestamp,
            timestampStr: timeStr,
            url: `/screenshots/${sessionId}/${newFilename}`,
        });
        slideIdx++;
    }

    // Save metadata
    fs.writeFileSync(path.join(sessionDir, 'metadata.json'), JSON.stringify({
        sessionId, title: videoInfo.title, folderName,
        duration, interval, uniqueOnly, mode, screenshots,
        createdAt: new Date().toISOString(),
    }, null, 2));

    send({
        type: 'complete',
        sessionId,
        screenshots,
        title: videoInfo.title,
        folderName,
        totalCount: screenshots.length,
    });

    res.end();
});

// GET /api/screenshots/:sessionId
router.get('/screenshots/:sessionId', (req, res) => {
    const metaPath = path.join(__dirname, '../screenshots', req.params.sessionId, 'metadata.json');
    if (!fs.existsSync(metaPath)) return res.status(404).json({ error: 'Session not found' });
    res.json(JSON.parse(fs.readFileSync(metaPath, 'utf-8')));
});

module.exports = router;
