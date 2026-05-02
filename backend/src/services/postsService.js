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
  author: {
  select: {
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
    _count: { select: { likes: true } },
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
  }

  if (data.content !== undefined) {
    payload.content = data.content;
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

async function deletePost(postId) {
  return prisma.post.delete({
    where: { id: postId },
    select: { id: true }
  });
}
async function getPosts({ category, viewerUserId } = {}) {
  const where = {};
  if (category) where.category = category;
  return prisma.post.findMany({
    where,
    select: buildPostSelectWithLikes(viewerUserId),
    orderBy: { createdAt: 'desc' }
  });
}

// 按 id 查询帖子（带点赞信息）
async function getPostById(postId, { viewerUserId } = {}) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: buildPostSelectWithLikes(viewerUserId),
  });
}

module.exports = {
  createPost,
  findPostById,
  updatePost,
  deletePost,
  getPosts,
  getPostById,
};
