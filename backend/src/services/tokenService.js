const crypto = require('crypto');

const { jwtSecret } = require('../config/env');

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  return Buffer.from(normalized, 'base64').toString('utf8');
}

function signToken(payload) {
  if (!payload || !payload.userId) {
    throw new Error('userId is required to sign token');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${content}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    const error = new Error('No token provided');
    error.statusCode = 401;
    throw error;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    const error = new Error('Invalid token');
    error.statusCode = 401;
    throw error;
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', jwtSecret)
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    const error = new Error('Invalid token');
    error.statusCode = 401;
    throw error;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    if (!payload || !payload.userId) {
      const error = new Error('Invalid token');
      error.statusCode = 401;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.message === 'Invalid token') {
      throw error;
    }

    const invalidTokenError = new Error('Invalid token');
    invalidTokenError.statusCode = 401;
    throw invalidTokenError;
  }
}

module.exports = {
  signToken,
  verifyToken
};
