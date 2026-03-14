const ytDlp = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);

async function test() {
    const child = ytDlp.exec('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
        format: 'worst', // download worst just for speed test
        output: '-',
        noWarnings: true
    }, { stdio: ['ignore', 'pipe', 'ignore'] });

    ffmpeg(child.stdout)
        .outputOptions(['-vf fps=1/10', '-q:v 2', '-f image2', '-vframes 3'])
        .output('test_frame_%04d.jpg')
        .on('end', () => console.log('Done!'))
        .on('error', (err) => console.error('FFmpeg err:', err))
        .run();
}
test();
