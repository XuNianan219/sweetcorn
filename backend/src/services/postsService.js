const prisma = require('../config/prisma');

const postSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  type: true,
  category: true,
  hashtags: true,
  content: true,
  title: true,
  mediaUrl: true,
  mediaUrls: true,
  mediaType: true,
  authorId: true,
  deletedAt: true,
  deletedBy: true,
  deletedByRole: true,
  author: {
  select: {
    id: true,
    nickname: true,
    avatarUrl: true,
  }
},
};

// 构造带有点赞信息的 select：包含 likeCount 和可选的当前用户点赞记录
// 如果传入 viewerUserId，则附带 likes（过滤出该用户的记录，用于判断 isLikedByMe）
function buildPostSelectWithLikes(viewerUserId) {
  const select = {
    ...postSelect,
    _count: { select: { likes: true, comments: { where: { deletedAt: null } } } },
  };
  if (viewerUserId) {
    select.likes = {
      where: { userId: viewerUserId },
      select: { id: true },
      take: 1,
    };
  }
  return select;
}

async function createPost(data) {
  const user = await prisma.user.findUnique({
    where: { id: data.authorId },
    select: { id: true }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type || '',
      category: data.category,
      hashtags: data.hashtags,
      mediaUrl: data.mediaUrl || '',
      mediaUrls: data.mediaUrls || [],
      mediaType: data.mediaType || 'none',
      author: {
        connect: { id: data.authorId }
      }
    },
    select: postSelect
  });
}

async function findPostById(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: postSelect
  });
}

async function updatePost(data) {
  const payload = {};

  if (data.title !== undefined) {
    payload.title = data.title;
    payload.titleEn = null; // 原文已改，清空英文译文缓存，下次翻译重新生成
  }

  if (data.content !== undefined) {
    payload.content = data.content;
    payload.contentEn = null; // 原文已改，清空英文译文缓存，下次翻译重新生成
  }

  if (data.type !== undefined) {
    payload.type = data.type;
  }

  if (data.category !== undefined) {
    payload.category = data.category;
  }

  if (data.hashtags !== undefined) {
    payload.hashtags = data.hashtags;
  }

  return prisma.post.update({
    where: { id: data.postId },
    data: payload,
    select: postSelect
  });
}

// 软删除：设置 deletedAt + 删除人 + 删除人角色（self / admin）
// self：进作者回收站可恢复；admin：对所有人消失，回收站也看不到
async function deletePost(postId, { deletedBy = null, deletedByRole = 'self' } = {}) {
  return prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date(), deletedBy, deletedByRole },
    select: { id: true }
  });
}

// 恢复：清空 deletedAt / deletedBy / deletedByRole，帖子回到原 category 对应分区
async function restorePost(postId) {
  return prisma.post.update({
    where: { id: postId },
    data: { deletedAt: null, deletedBy: null, deletedByRole: null },
    select: { id: true }
  });
}

// 永久删除：真正从数据库移除（likes 有 onDelete: Cascade 一并删除）
async function permanentlyDeletePost(postId) {
  return prisma.post.delete({
    where: { id: postId },
    select: { id: true }
  });
}

// 当前用户回收站：只返回「自己删除的自己帖子」（deletedByRole === 'self'）
// 管理员删除的帖子（deletedByRole === 'admin'）对所有人消失，不进回收站
async function getDeletedPostsByUser(userId) {
  return prisma.post.findMany({
    where: { authorId: userId, deletedAt: { not: null }, deletedByRole: 'self' },
    orderBy: { deletedAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      mediaUrl: true,
      mediaUrls: true,
      mediaType: true,
      deletedAt: true,
      deletedByRole: true,
      createdAt: true,
    },
  });
}

async function getPosts({ category, viewerUserId } = {}) {
  const where = { deletedAt: null };
  if (category) where.category = category;
  return prisma.post.findMany({
    where,
    select: buildPostSelectWithLikes(viewerUserId),
    orderBy: { createdAt: 'desc' }
  });
}

// 按 id 查询帖子（带点赞信息），不返回已软删除的
async function getPostById(postId, { viewerUserId } = {}) {
  return prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: buildPostSelectWithLikes(viewerUserId),
  });
}

module.exports = {
  createPost,
  findPostById,
  updatePost,
  deletePost,
  restorePost,
  permanentlyDeletePost,
  getDeletedPostsByUser,
  getPosts,
  getPostById,
};
