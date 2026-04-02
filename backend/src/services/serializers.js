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

  return {
    id: post.id,
    createdAt: post.createdAt,
    type: post.type,
    content: post.content,
    title: post.title,
    mediaUrl: post.mediaUrl,
    userId: post.authorId
  };
}

module.exports = {
  serializeUser,
  serializePost
};
