const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const AWS = require("aws-sdk");
const shortid = require("shortid");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const dotenv = require("dotenv");
const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;
dotenv.config();

console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY);
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME);
console.log("DYNAMODB_TABLE_NAME:", process.env.DYNAMODB_TABLE_NAME);

module.exports = () => {
  const uploadImage = async (req, res) => {
    // Check if username is provided in the request body
    if (!req.body.username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!req.files || !req.files.files) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    const files = Array.isArray(req.files.files)
      ? req.files.files
      : [req.files.files];
    const uploadPromises = files.map(async (file) => {
      const fileKey = `uploads/${shortid.generate()}-${file.name}`;

      try {
        // Upload to S3
        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: file.data,
        };
        await s3.send(new PutObjectCommand(uploadParams));

        // Store metadata in DynamoDB
        const metadata = {
          "qut-username": { S: req.body.username }, // Ensure this is provided in the request
          "image-id": { S: shortid.generate() },
          "file-name": { S: file.name },
          "file-key": { S: fileKey },
          "upload-date": { S: new Date().toISOString() },
        };

        const dbParams = {
          TableName: tableName,
          Item: metadata,
        };

        console.log("Storing metadata in DynamoDB:", dbParams);
        await dynamoDB.send(new PutItemCommand(dbParams));

        return { id: metadata["image-id"].S, key: fileKey, name: file.name };
      } catch (err) {
        console.error(
          "Error uploading file to S3 or storing metadata in DynamoDB:",
          err
        );
        throw { message: "File Upload Failed", error: err };
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      res
        .status(200)
        .json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
      console.error("Error in uploadImage:", error);
      res.status(500).json({ message: "File upload failed", error });
    }
  };

  const convertImage = async (req, res) => {
    const { key, format } = req.body;

    if (!key || !format) {
      return res.status(400).json({ message: "Key and format are required" });
    }

    try {
      console.log(`Fetching object with key: ${key}`);
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      };

      const data = await s3.send(new GetObjectCommand(params));
      const buffer = await streamToBuffer(data.Body);

      const convertedImage = await sharp(buffer).toFormat(format).toBuffer();

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key.replace(/\.\w+$/, `.${format}`),
        Body: convertedImage,
        ContentType: `image/${format}`,
      };

      await s3.send(new PutObjectCommand(uploadParams));
      res.status(200).json({
        message: "Image converted successfully",
        key: uploadParams.Key,
      });
    } catch (error) {
      console.error("Error converting image:", error);
      res
        .status(500)
        .json({ message: "Error converting image", error: error.message });
    }
  };

  const streamToBuffer = async (readableStream) => {
    const chunks = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };

  const listUploadedFiles = (req, res) => {
    const outputDir = path.join(__dirname, "..", "uploads");

    fs.readdir(outputDir, (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error reading directory", error: err.message });
      }
      res.status(200).json({ files });
    });
  };

  const deleteImage = async (req, res) => {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${filename}`,
    };

    try {
      await s3.send(new DeleteObjectCommand(params));
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res
        .status(500)
        .json({ message: "File deletion failed", error: error.message });
    }
  };
  return { uploadImage, convertImage, listUploadedFiles, deleteImage };
};
