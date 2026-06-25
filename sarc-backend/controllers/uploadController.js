const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

exports.generateSignature = async (req, res) => {
    try {
        if (!supabase) {
            console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
            return res.status(500).json({ message: 'Supabase credentials missing in .env' });
        }
        
        const filename = req.query.filename || `file_${Date.now()}`;
        // Sanitize filename and add a unique timestamp
        const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uniqueFilename = `uploads/${Date.now()}_${safeFilename}`;
        
        const bucket = process.env.SUPABASE_BUCKET || 'sarc-uploads';
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUploadUrl(uniqueFilename);

        if (error) {
            console.error('Supabase signed URL error:', error);
            return res.status(500).json({ message: 'Failed to create upload URL' });
        }

        // Return both the signed URL (for uploading) and the final public URL (to save in DB)
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${uniqueFilename}`;

        res.status(200).json({
            signedUrl: data.signedUrl,
            publicUrl: publicUrl
        });
    } catch (error) {
        console.error('Error generating signature:', error);
        res.status(500).json({ message: 'Error generating upload signature' });
    }
};
