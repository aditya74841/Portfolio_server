import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, folder = "portfolio-avatars") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" },
                    { quality: "auto", fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );
        stream.end(fileBuffer);
    });
};

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
    }
};

export default cloudinary;
