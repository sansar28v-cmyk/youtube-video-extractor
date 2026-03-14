export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vercel serverless functions have limitations for long-running video processing
    return res.status(501).json({
        error: 'Video extraction is not supported on Vercel due to serverless limitations. Please use Railway or Render for full functionality.'
    });
}