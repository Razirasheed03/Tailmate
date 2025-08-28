import cloudinary from "../config/cloudinary";

export async function uploadPdfBufferToCloudinary(buffer: Buffer, filename: string) {
  // why: Cloudinary raw uploads accept data URI or buffer stream; here we use upload_stream
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // important for PDFs
        folder: "doctor-certificates", // why: organize in folder
        public_id: filename.replace(/\.[^/.]+$/, ""), // strip extension
        use_filename: true,
        unique_filename: true, // avoids collisions
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}
