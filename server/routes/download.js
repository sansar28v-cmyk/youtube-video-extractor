const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');

function getSessionDir(sessionId) {
    return path.join(__dirname, '../screenshots', sessionId);
}

function getMetadata(sessionDir) {
    const metaPath = path.join(sessionDir, 'metadata.json');
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

// Download all screenshots as ZIP
router.get('/download/zip/:sessionId', async (req, res) => {
    const sessionDir = getSessionDir(req.params.sessionId);
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
        // We already rename files to slide_xx_xx-xx-xx.jpg inside extract.js
        archive.file(path.join(sessionDir, file), { name: `${folderName}/${file}` })
    });
    await archive.finalize();
});

// Export as PDF
router.get('/download/pdf/:sessionId', async (req, res) => {
    const sessionDir = getSessionDir(req.params.sessionId);
    const metadata = getMetadata(sessionDir);
    if (!metadata) return res.status(404).json({ error: 'Session not found' });

    const folderName = metadata.folderName || 'screenshots';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.pdf"`);

    // A4 Portrait for vertical slides
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    // Title page
    doc.fontSize(28).fillColor('#3B82F6').text('YouTube Screenshot Extractor', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#333333').text(metadata.title || 'Video', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666')
        .text(`Mode: ${metadata.mode || 'Slide'}  |  Screenshots: ${metadata.screenshots?.length || 0}  |  ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const screenshots = (metadata.screenshots || []).filter(s => {
        const imgPath = path.join(sessionDir, s.filename);
        return fs.existsSync(imgPath);
    });

    const pageWidth = doc.page.width - 80;

    // Draw screenshots top-to-bottom on each page
    // A4 portrait is 595.28 x 841.89 points
    screenshots.forEach((shot, index) => {
        if (index > 0) doc.addPage();

        // Centered timestamp
        doc.fontSize(12).fillColor('#555555').text(`⏱ Timestamp: ${shot.timestampStr}`, { align: 'center' });
        doc.moveDown(0.5);

        try {
            // Draw image high resolution (PDFKit handles resolution effectively when fitting)
            doc.image(path.join(sessionDir, shot.filename), {
                fit: [pageWidth, 600],
                align: 'center',
                valign: 'top'
            });
        } catch (e) {
            doc.fontSize(10).fillColor('#999').text(`[Image unavailable: ${shot.filename}]`, { align: 'center' });
        }
    });

    doc.end();
});

// Delete session
router.delete('/session/:sessionId', (req, res) => {
    const sessionDir = getSessionDir(req.params.sessionId);
    if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'Session not found' });
});

module.exports = router;
