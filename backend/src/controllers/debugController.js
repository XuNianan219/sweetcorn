const prisma = require('../config/prisma');
const { createUser } = require('../services/usersService');
const { serializeUser } = require('../services/serializers');

async function createEmptyUserHandler(req, res, next) {
  try {
    const user = await createUser({
      nickname: 'empty_user'
    });

    res.status(201).json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

async function setPhoneHandler(req, res, next) {
  try {
    const userId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

    if (!userId || !phone) {
      res.status(400);
      throw new Error('userId and phone are required');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { phone },
      select: {
        id: true,
        phone: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEmptyUserHandler,
  setPhoneHandler
};
