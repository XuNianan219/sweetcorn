const {
  createUser,
  getUserPosts,
  findUserById,
  updateMyProfile
} = require('../services/usersService');
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

async function getMeHandler(req, res, next) {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      res.status(404);
      throw new Error('用户不存在');
    }
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

async function updateMeHandler(req, res, next) {
  try {
    const nickname = normalizeOptionalString(req.body.nickname);
    const avatarUrl = normalizeOptionalString(req.body.avatarUrl);
    // bio 允许置空（清空个性签名），所以单独处理：传了 string 就用（trim），否则不动
    const bio = typeof req.body.bio === 'string' ? req.body.bio.trim().slice(0, 100) : undefined;

    const user = await updateMyProfile(req.user.userId, { nickname, avatarUrl, bio });
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserHandler,
  getUserPostsHandler,
  getMeHandler,
  updateMeHandler
};
