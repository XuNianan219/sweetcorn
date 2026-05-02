function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    phone: user.phone,
    wechatOpenid: user.wechatOpenid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
  };
}

function serializePost(post) {
  if (!post) {
    return null;
  }

  const base = {
    id: post.id,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    type: post.type || null,
    category: post.category || null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    content: post.content,
    title: post.title,
    mediaUrl: post.mediaUrl || null,
    mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
    mediaType: post.mediaType || 'none',
    authorId: post.authorId,
    author: post.author ? { nickname: post.author.nickname, avatarUrl: post.author.avatarUrl } : null,
  };

  // 如果查询结果带有 _count.likes，则附加 likeCount 字段
  if (post._count && typeof post._count.likes === 'number') {
    base.likeCount = post._count.likes;
  }
  // 如果查询时附带了当前登录用户维度的 likes，则给出 isLikedByMe
  if (Array.isArray(post.likes)) {
    base.isLikedByMe = post.likes.length > 0;
  }

  return base;
}

module.exports = {
  serializeUser,
  serializePost
};
