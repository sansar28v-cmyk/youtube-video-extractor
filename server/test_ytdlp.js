const ytDlp = require('yt-dlp-exec');

async function test() {
    try {
        const info = await ytDlp('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            dumpSingleJson: true,
            noWarnings: true,
            format: 'best[height<=720]/best'
        });
        console.log("URL:", !!info.url);
        console.log("Headers:", info.http_headers);
    } catch (err) {
        console.error(err);
    }
}
test();
