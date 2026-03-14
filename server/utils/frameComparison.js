const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const stringSimilarity = require('string-similarity');
const ssim = require('ssim.js');
const cv = require('@techstark/opencv-js');

let workerPromise = null;

async function getWorker() {
    if (!workerPromise) {
        workerPromise = (async () => {
            const worker = await Tesseract.createWorker('eng');
            return worker;
        })();
    }
    return workerPromise;
}

/**
 * Compare two frames using SSIM on the specified cropped buffer sizes.
 */
function getSsimScore(buf1, buf2, width, height) {
    // raw grayscale buffers have 1 channel
    const img1 = { data: new Uint8Array(buf1), width, height, channels: 1 };
    const img2 = { data: new Uint8Array(buf2), width, height, channels: 1 };
    const result = ssim.ssim(img1, img2);
    return result.mssim;
}

/**
 * Compare two image frames and return true if they are sufficiently different.
 */
async function compareFrames(frame1Path, frame2Path, options = {}) {
    const {
        mode = 'slide',     // 'slide' or 'board'
        cropFactor = 0.7,   // For slide mode: center 70%
    } = options;

    try {
        const targetWidth = 1280;
        const targetHeight = 720;

        if (mode === 'slide') {
            const keepW = Math.floor(targetWidth * cropFactor);
            const keepH = Math.floor(targetHeight * cropFactor);
            const left = Math.floor((targetWidth - keepW) / 2);
            const top = Math.floor((targetHeight - keepH) / 2);
            const cropOptions = { left, top, width: keepW, height: keepH };

            const [img1Buffer, img2Buffer] = await Promise.all([
                sharp(frame1Path)
                    .resize(targetWidth, targetHeight, { fit: 'fill' })
                    .extract(cropOptions)
                    .raw()
                    .greyscale()
                    .toBuffer(),
                sharp(frame2Path)
                    .resize(targetWidth, targetHeight, { fit: 'fill' })
                    .extract(cropOptions)
                    .raw()
                    .greyscale()
                    .toBuffer()
            ]);

            const png1 = await sharp(img1Buffer, { raw: { width: keepW, height: keepH, channels: 1 } }).png().toBuffer();
            const png2 = await sharp(img2Buffer, { raw: { width: keepW, height: keepH, channels: 1 } }).png().toBuffer();

            const worker = await getWorker();
            const [result1, result2] = await Promise.all([
                worker.recognize(png1),
                worker.recognize(png2)
            ]);

            const text1 = result1.data.text.trim();
            const text2 = result2.data.text.trim();

            // Smart content filter: Ignore if new frame has almost no text
            if (text2.length < 5) {
                return false;
            }

            const ssimScore = getSsimScore(img1Buffer, img2Buffer, keepW, keepH);

            // Similarity < 0.92 indicates difference
            if (ssimScore < 0.92) {
                return true;
            }

            let textDiff = 0;
            if (text1 === '' && text2 === '') {
                textDiff = 0;
            } else if (text1 === '' || text2 === '') {
                textDiff = 1;
            } else {
                const textSimilarity = stringSimilarity.compareTwoStrings(text1, text2);
                textDiff = 1 - textSimilarity;
            }

            // OCR text difference > 12%
            if (textDiff > 0.12) {
                return true;
            }

            return false;

        } else if (mode === 'board') {
            // Board mode: Ignore left and right 20%
            const cropW = Math.floor(targetWidth * 0.6);
            const cropH = targetHeight;
            const left = Math.floor(targetWidth * 0.2);
            const top = 0;

            const [buf1, buf2] = await Promise.all([
                sharp(frame1Path)
                    .resize(targetWidth, targetHeight, { fit: 'fill' })
                    .extract({ left, top, width: cropW, height: cropH })
                    .ensureAlpha()
                    .raw()
                    .toBuffer(),
                sharp(frame2Path)
                    .resize(targetWidth, targetHeight, { fit: 'fill' })
                    .extract({ left, top, width: cropW, height: cropH })
                    .ensureAlpha()
                    .raw()
                    .toBuffer()
            ]);

            const mat1 = cv.matFromImageData({ width: cropW, height: cropH, data: new Uint8ClampedArray(buf1) });
            const mat2 = cv.matFromImageData({ width: cropW, height: cropH, data: new Uint8ClampedArray(buf2) });

            const gray1 = new cv.Mat();
            const gray2 = new cv.Mat();
            cv.cvtColor(mat1, gray1, cv.COLOR_RGBA2GRAY);
            cv.cvtColor(mat2, gray2, cv.COLOR_RGBA2GRAY);

            // Canny edge detection
            const edges1 = new cv.Mat();
            const edges2 = new cv.Mat();
            cv.Canny(gray1, edges1, 50, 150);
            cv.Canny(gray2, edges2, 50, 150);

            // Smart filter: ensure new frame has content
            const edgesCount = cv.countNonZero(edges2);
            if (edgesCount < (cropW * cropH * 0.01)) { // less than 1% edges => blank board
                mat1.delete(); mat2.delete();
                gray1.delete(); gray2.delete();
                edges1.delete(); edges2.delete();
                return false;
            }

            // Difference mask
            const diff = new cv.Mat();
            cv.absdiff(edges1, edges2, diff);

            // Morphological filtering to group nearby edge differences
            const M = cv.Mat.ones(5, 5, cv.CV_8U);
            const filteredDiff = new cv.Mat();
            cv.dilate(diff, filteredDiff, M);
            cv.erode(filteredDiff, filteredDiff, M);

            // Count non-zero pixels
            const nonZero = cv.countNonZero(filteredDiff);
            const totalPixels = cropW * cropH;
            const changeRatio = nonZero / totalPixels;

            mat1.delete(); mat2.delete();
            gray1.delete(); gray2.delete();
            edges1.delete(); edges2.delete();
            diff.delete(); filteredDiff.delete();
            M.delete();

            // Threshold: if enough edge pixels changed, consider it a new frame
            // Tuning threshold: 0.005 (0.5% of pixels) signifies substantial new line strokes
            if (changeRatio > 0.005) {
                return true;
            }

            return false;
        }

        return false;

    } catch (error) {
        console.error('Frame comparison error:', error.message);
        return true;
    }
}

process.on('exit', async () => {
    if (workerPromise) {
        const worker = await workerPromise;
        await worker.terminate();
    }
});

module.exports = { compareFrames };
