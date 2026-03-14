const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

function getSessionDir(sessionId) {
    return path.join(__dirname, '../../screenshots', sessionId);
}

function getMetadata(sessionDir) {
    const metaPath = path.join(sessionDir, 'metadata.json');
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionId } = req.query;
    const sessionDir = getSessionDir(sessionId);
    const metadata = getMetadata(sessionDir);
    if (!metadata) return res.status(404).json({ error: 'Session not found' });

    const folderName = metadata.folderName || 'screenshots';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { console.error(err); res.status(500).end(); });
    archive.pipe(res);

    const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jpg'));
    files.forEach(file => {
        archive.file(path.join(sessionDir, file), { name: `${folderName}/${file}` });
    });
    await archive.finalize();
}