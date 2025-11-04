import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function uploadImageToS3(file) {
  const fileKey = `products/${uuid()}-${file.originalname}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
}

export default uploadImageToS3;
