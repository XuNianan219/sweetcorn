const { createUser, getUserPosts } = require('../services/usersService');
const { serializeUser, serializePost } = require('../services/serializers');

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

async function createUserHandler(req, res, next) {
  try {
    const phone = normalizeOptionalString(req.body.phone);
    const nickname = normalizeOptionalString(req.body.nickname);
    const wechatOpenid = normalizeOptionalString(req.body.wechatOpenid);
    const avatarUrl = normalizeOptionalString(req.body.avatarUrl);

    if (!phone && !wechatOpenid) {
      res.status(400);
      throw new Error('phone or wechatOpenid is required');
    }

    const user = await createUser({
      phone,
      nickname,
      wechatOpenid,
      avatarUrl
    });

    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

async function getUserPostsHandler(req, res, next) {
  try {
    const posts = await getUserPosts(req.params.id);

    res.json(posts.map(serializePost));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserHandler,
  getUserPostsHandler
};
