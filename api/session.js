const path = require('path');
const fs = require('fs');

function getSessionDir(sessionId) {
    return path.join(__dirname, '../screenshots', sessionId);
}

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sessionId } = req.query;
    const sessionDir = getSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'Session not found' });
}