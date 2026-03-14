const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

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
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.pdf"`);

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

    screenshots.forEach((shot, index) => {
        if (index > 0) doc.addPage();

        doc.fontSize(12).fillColor('#555555').text(`⏱ Timestamp: ${shot.timestampStr}`, { align: 'center' });
        doc.moveDown(0.5);

        try {
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
}