// R2 上传与删除工具函数
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { s3Client, BUCKET_NAME } = require('../config/r2');

// 上传文件到 R2，folder: 'images' | 'videos' | 'avatars'
async function uploadToR2(fileBuffer, originalName, mimeType, folder) {
  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return {
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
    key,
  };
}

// 从 R2 删除指定 key 的文件
async function deleteFromR2(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
  return { success: true };
}

module.exports = {
  uploadToR2,
  deleteFromR2,
};
