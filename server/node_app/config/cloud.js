import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from "dotenv";

dotenv.config();

const client = new S3Client({
  endpoint: `${process.env.APPWRITE_ENDPOINT}/s3`,
  region: "auto",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.APPWRITE_PROJECT_ID,
    secretAccessKey: process.env.APPWRITE_API_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const generateUploadUrl = async (objectKey, contentType) => {
  return await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: process.env.ATTACHMENTS_BUCKET_ID,
      Key: objectKey,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
};

const generateViewUrl = async (objectKey) => {
  return await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.ATTACHMENTS_BUCKET_ID,
      Key: objectKey,
    }),
    { expiresIn: 900 },
  );
};

const generateDownloadUrl = async (objectKey, fileName) => {
  return await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: process.env.ATTACHMENTS_BUCKET_ID,
      Key: objectKey,
      ResponseContentDisposition: `filename="${fileName}"`,
    }),
    { expiresIn: 300 },
  );
};

const deleteFile = async (objectKey) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.ATTACHMENTS_BUCKET_ID,
      Key: objectKey,
    });

    await client.send(command);
    console.log("File deleted successfully: ", objectKey);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export { generateUploadUrl, generateViewUrl, deleteFile, generateDownloadUrl };
