import "dotenv/config";
import { v2 as cloudinary } from 'cloudinary';
import { UploadedFile } from 'express-fileupload';

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload either a file path or a buffer to Cloudinary
export const uploadFile = async (file: string | UploadedFile): Promise<string> => {
    try {
        // Upload from buffer
        if (typeof file !== 'string') {
            return new Promise<string>((resolve:any, reject:any) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'auto' },
                    (error, uploadResult) => {
                        if (error) {
                            reject('Failed to upload file');
                        } else {
                            resolve(uploadResult?.secure_url);
                        }
                    }
                ).end(file.data);
            });
        }
        
        // Upload from file path
        const result = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
        });

        return result.secure_url;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file');
    }
};
