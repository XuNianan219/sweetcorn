// 媒体文件上传与删除路由
const express = require('express');
const { uploadSingle } = require('../middleware/upload');
const { uploadToR2, deleteFromR2 } = require('../utils/upload');

const router = express.Router();

// POST /api/media/upload — 上传单个文件到 R2
// TODO: 接前端后加回 requireAuth 认证中间件
router.post('/upload', uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未提供文件' });
    }

    // 根据 mimetype 前缀判断存储目录
    const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';

    const { url, key } = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.json({ success: true, url, key, fileType: folder });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/media/:key(*) — 删除 R2 中的文件（key 可能含斜杠）
// TODO: 接前端后加回 requireAuth 认证中间件
router.delete('/:key(*)', async (req, res) => {
  try {
    await deleteFromR2(req.params.key);
    res.json({ success: true });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
