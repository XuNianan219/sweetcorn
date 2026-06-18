const bcrypt = require('bcrypt');
const { serializeUser } = require('../services/serializers');
const { signToken } = require('../services/tokenService');
const {
  findUserByPhoneForLogin,
  createUser,
  bindUserIdentifiers
} = require('../services/usersService');

function normalizeOptionalString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function isValidPhone(phone) {
  return /^1\d{10}$/.test(phone);
}

async function registerHandler(req, res, next) {
  try {
    const phone = normalizeOptionalString(req.body.phone);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const nickname = normalizeOptionalString(req.body.nickname);

    if (!phone || !isValidPhone(phone)) {
      res.status(400);
      throw new Error('手机号格式不正确（11位数字，1开头）');
    }
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('密码至少6位');
    }

    const existing = await findUserByPhoneForLogin(phone);
    if (existing) {
      res.status(409);
      throw new Error('该手机号已注册，请直接登录');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ phone, password: passwordHash, nickname, role: 'user' });

    const serializedUser = serializeUser(user);
    const token = signToken({ userId: serializedUser.id, phone: serializedUser.phone });

    res.status(201).json({ user: serializedUser, token });
  } catch (error) {
    next(error);
  }
}

async function loginHandler(req, res, next) {
  try {
    const phone = normalizeOptionalString(req.body.phone);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!phone) {
      res.status(400);
      throw new Error('手机号不能为空');
    }
    if (!password) {
      res.status(400);
      throw new Error('密码不能为空');
    }

    const user = await findUserByPhoneForLogin(phone);
    if (!user) {
      res.status(401);
      throw new Error('手机号未注册，请先注册');
    }
    if (!user.password) {
      res.status(401);
      throw new Error('该账号尚未设置密码，请重新注册');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401);
      throw new Error('密码错误');
    }

    if (user.status === 'banned') {
      res.status(403);
      throw new Error('账号已被禁用，请联系管理员');
    }

    const serializedUser = serializeUser(user);
    const token = signToken({ userId: serializedUser.id, phone: serializedUser.phone });

    res.json({ user: serializedUser, token });
  } catch (error) {
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

    const user = await bindUserIdentifiers(req.user.id, { phone, wechatOpenid });
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

module.exports = { registerHandler, loginHandler, bindHandler };
