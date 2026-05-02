const { Prisma } = require('@prisma/client');

function errorHandler(err, req, res, next) {
  console.error('🔴 全局错误处理:', err);
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with the same unique field already exists';

      if (Array.isArray(err.meta?.target)) {
        if (err.meta.target.includes('phone')) {
          message = 'Phone already exists';
        }

        if (
          err.meta.target.includes('wechat_openid') ||
          err.meta.target.includes('wechatOpenid')
        ) {
          message = 'Wechat openid already exists';
        }
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid request data';
  }

  res.status(statusCode).json({
    message
  });
}

module.exports = errorHandler;
