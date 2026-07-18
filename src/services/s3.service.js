const {
    PutObjectCommand,
    DeleteObjectCommand,
  } = require("@aws-sdk/client-s3");
  
  const { v4: uuid } = require("uuid");
  const path = require("path");
  
  const s3 = require("../config/aws");
  
  const uploadToS3 = async (file, folder) => {
    const extension = path.extname(file.originalname);
  
    const fileName = `${folder}/${uuid()}${extension}`;
  
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
  
    await s3.send(command);
  
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  };
  
  const deleteFromS3 = async (fileUrl) => {
    try {
      const key = fileUrl.split(".amazonaws.com/")[1];
  
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        })
      );
    } catch (err) {
      console.log("Delete Error:", err.message);
    }
  };
  
  module.exports = {
    uploadToS3,
    deleteFromS3,
  };