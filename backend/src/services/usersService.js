const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');

function createConflictError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

async function findUserByIdentifier(data) {
  let user = null;

  if (data.phone) {
    user = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: {
        id: true,
        phone: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  }

  if (!user && data.wechatOpenid) {
    user = await prisma.user.findUnique({
      where: { wechatOpenid: data.wechatOpenid },
      select: {
        id: true,
        phone: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  }

  return user;
}

async function findUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      wechatOpenid: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true
    }
  });
}

async function bindUserIdentifiers(userId, data) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isBindingPhone = data.phone !== undefined;
  const isBindingWechatOpenid = data.wechatOpenid !== undefined;
  const hasBoundPhone = currentUser.phone !== null && currentUser.phone !== undefined;
  const hasBoundWechatOpenid =
    currentUser.wechatOpenid !== null && currentUser.wechatOpenid !== undefined;

  if (isBindingPhone && isBindingWechatOpenid && hasBoundPhone && hasBoundWechatOpenid) {
    throw createConflictError('Current account already has both phone and wechatOpenid bound');
  }

  if (isBindingPhone) {
    if (hasBoundPhone) {
      throw createConflictError('当前账号已存在手机号');
    }

    const phoneOwner = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: { id: true }
    });

    if (phoneOwner && phoneOwner.id !== userId) {
      throw createConflictError('该手机号已被其他账号占用');
    }
  }

  if (isBindingWechatOpenid) {
    if (hasBoundWechatOpenid) {
      throw createConflictError('当前账号已存在微信');
    }

    const wechatOwner = await prisma.user.findUnique({
      where: { wechatOpenid: data.wechatOpenid },
      select: { id: true }
    });

    if (wechatOwner && wechatOwner.id !== userId) {
      throw createConflictError('该微信已被其他账号占用');
    }
  }

  const payload = {};

  if (data.phone !== undefined) {
    payload.phone = data.phone;
  }

  if (data.wechatOpenid !== undefined) {
    payload.wechatOpenid = data.wechatOpenid;
  }

  if (Object.keys(payload).length === 0) {
    return currentUser;
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: payload,
      select: {
        id: true,
        phone: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (Array.isArray(error.meta?.target)) {
        if (error.meta.target.includes('phone')) {
          throw createConflictError('该手机号已被其他账号占用');
        }

        if (
          error.meta.target.includes('wechat_openid') ||
          error.meta.target.includes('wechatOpenid')
        ) {
          throw createConflictError('该微信已被其他账号占用');
        }
      }
    }

    throw error;
  }
}

async function createUser(data) {
  const duplicateChecks = [];

  if (data.phone) {
    duplicateChecks.push({ phone: data.phone });
  }

  if (data.wechatOpenid) {
    duplicateChecks.push({ wechatOpenid: data.wechatOpenid });
  }

  if (duplicateChecks.length > 0) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: duplicateChecks
      },
      select: {
        id: true,
        phone: true,
        wechatOpenid: true
      }
    });

    if (existingUser) {
      const error = new Error(
        existingUser.phone === data.phone
          ? 'Phone already exists'
          : 'Wechat openid already exists'
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const payload = {};

  if (data.phone !== undefined) {
    payload.phone = data.phone;
  }

  if (data.nickname !== undefined) {
    payload.nickname = data.nickname;
  }

  if (data.wechatOpenid !== undefined) {
    payload.wechatOpenid = data.wechatOpenid;
  }

  if (data.avatarUrl !== undefined) {
    payload.avatarUrl = data.avatarUrl;
  }

  return prisma.user.create({
    data: payload,
    select: {
      id: true,
      phone: true,
      wechatOpenid: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true
    }
  });
}

async function getUserPosts(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
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
      authorId: true
    }
  });
}

module.exports = {
  bindUserIdentifiers,
  createUser,
  getUserPosts,
  findUserByIdentifier,
  findUserById
};
