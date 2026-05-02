const { loginOrCreateUser } = require('../services/authService');
const { serializeUser } = require('../services/serializers');
const { signToken } = require('../services/tokenService');
const { bindUserIdentifiers } = require('../services/usersService');

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

async function loginHandler(req, res, next) {
  try {
    const phone = normalizeOptionalString(req.body.phone);
    const wechatOpenid = normalizeOptionalString(req.body.wechatOpenid);
    const nickname = normalizeOptionalString(req.body.nickname);
    const avatarUrl = normalizeOptionalString(req.body.avatarUrl);

    if (!phone && !wechatOpenid) {
      res.status(400);
      throw new Error('phone or wechatOpenid is required');
    }

    const user = await loginOrCreateUser({
      phone,
      wechatOpenid,
      nickname,
      avatarUrl
    });

    const serializedUser = serializeUser(user);
    const token = signToken({
      userId: serializedUser.id,
      phone: serializedUser.phone || undefined,
      wechatOpenid: serializedUser.wechatOpenid || undefined
    });

    res.json({
      user: serializedUser,
      token
    });
  } catch (error) {
    console.error('🔴🔴🔴 登录错误详情 🔴🔴🔴');
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('完整错误:', error);
    console.error('🔴🔴🔴 ---结束--- 🔴🔴🔴');
    next(error);
  }
}

async function bindHandler(req, res, next) {
  try {
    const phone = normalizeOptionalString(req.body.phone);
    const wechatOpenid = normalizeOptionalString(req.body.wechatOpenid);

    if (!phone && !wechatOpenid) {
      res.status(400);
      throw new Error('phone or wechatOpenid is required');
    }

    const user = await bindUserIdentifiers(req.user.id, {
      phone,
      wechatOpenid
    });

    res.json(serializeUser(user));
  } catch (error) {
    console.error('🔴 登录错误:', error);
    next(error);
  }
}

module.exports = {
  loginHandler,
  bindHandler
};
