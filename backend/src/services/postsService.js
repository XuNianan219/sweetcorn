const prisma = require('../config/prisma');

async function createPost(data) {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
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
      type: data.type,
      mediaUrl: data.mediaUrl || '',
      author: {
        connect: { id: data.userId }
      }
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      content: true,
      title: true,
      mediaUrl: true,
      authorId: true
    }
  });
}

module.exports = {
  createPost
};
