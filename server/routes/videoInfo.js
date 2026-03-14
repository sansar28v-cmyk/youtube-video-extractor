const express = require('express');
const router = express.Router();
const ytDlp = require('yt-dlp-exec');

function isValidYouTubeUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]{11}/;
    return regex.test(url);
}

router.get('/video-info', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!isValidYouTubeUrl(url)) return res.status(400).json({ error: 'Invalid YouTube URL' });

    try {
        const info = await ytDlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
        });

        if (info.duration > 7200) {
            return res.status(400).json({ error: 'Video too long. Maximum allowed is 2 hours.' });
        }

        res.json({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            viewCount: info.view_count,
            videoId: info.id,
            uploadDate: info.upload_date,
        });
    } catch (error) {
        console.error('Error fetching video info:', error.message);
        if (error.message.includes('yt-dlp')) {
            return res.status(500).json({ error: 'yt-dlp not found. Please ensure it is installed.' });
        }
        res.status(500).json({ error: 'Failed to fetch video info: ' + error.message });
    }
});

module.exports = router;
module.exports.isValidYouTubeUrl = isValidYouTubeUrl;
