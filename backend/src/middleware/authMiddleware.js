const { verifyToken } = require('../services/tokenService');
const { findUserById } = require('../services/usersService');
const { serializeUser } = require('../services/serializers');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401);
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401);
      throw new Error('No token provided');
    }

    console.log(token);

    const decoded = verifyToken(token);

    console.log(decoded);

    const user = await findUserById(decoded.userId);

    if (!user) {
      res.status(401);
      throw new Error('User not found for token');
    }

    req.user = {
      ...serializeUser(user),
      userId: user.id
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAuth;
