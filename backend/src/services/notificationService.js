const prisma = require('../config/prisma');

// 创建通知。失败仅 console.error，绝不抛出，避免阻塞主接口。
// 跳过自己给自己的通知（点赞自己/评论自己等）。
async function createNotification({
  userId,
  type,
  title,
  content = '',
  actorId = null,
  postId = null,
  commentId = null,
  link = '',
}) {
  try {
    if (!userId || !type || !title) return null;
    if (actorId && userId === actorId) return null;

    return await prisma.notification.create({
      data: { userId, type, title, content, actorId, postId, commentId, link },
    });
  } catch (err) {
    console.error('创建通知失败:', err.message);
    return null;
  }
}

module.exports = { createNotification };
