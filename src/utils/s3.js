import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

/**
 * Sube un archivo a S3 y devuelve la URL pública.
 *
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {string} URL pública
 */
export const uploadToS3 = async (buffer, mimetype) => {
    const filename = `avatars/${nanoid()}.webp`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: mimetype,
        ACL: "public-read"
    });

    await s3.send(command);

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};
