/**
 * Uploads a file directly to Supabase Storage using a signed URL from the backend.
 * (File name kept as cloudinaryUpload.js to avoid breaking existing imports)
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded file.
 */
export const uploadToCloudinary = async (file) => {
    try {
        const token = localStorage.getItem('sarc_token');
        
        const baseURL = import.meta.env.VITE_API_URL || '';
        const sigResponse = await fetch(`${baseURL}/api/upload/signature?filename=${encodeURIComponent(file.name)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!sigResponse.ok) {
            throw new Error('Failed to get upload signature');
        }
        
        const data = await sigResponse.json();
        
        // 2. Upload directly to Supabase using the signed URL
        const uploadResponse = await fetch(data.signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream'
            }
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file to storage');
        }

        // 3. Return the public URL to save in the database
        return data.publicUrl;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
};
