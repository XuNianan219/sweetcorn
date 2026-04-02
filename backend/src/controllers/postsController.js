const { createPost } = require('../services/postsService');
const { serializePost } = require('../services/serializers');
const { getUserPosts } = require('../services/usersService');

function normalizeRequiredString(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim();
}

async function createPostHandler(req, res, next) {
  try {
    const title = normalizeRequiredString(req.body.title);
    const content = normalizeRequiredString(req.body.content);
    const type = normalizeRequiredString(req.body.type);

    if (!title || !content || !type) {
      res.status(400);
      throw new Error('title, content, and type are required');
    }

    const post = await createPost({
      userId: req.user.userId,
      title,
      content,
      type
    });

    res.status(201).json(serializePost(post));
  } catch (error) {
    next(error);
  }
}

async function createMyPostHandler(req, res, next) {
  try {
    const title = normalizeRequiredString(req.body.title);
    const content = normalizeRequiredString(req.body.content);
    const type = normalizeRequiredString(req.body.type);

    if (!title || !content || !type) {
      res.status(400);
      throw new Error('title, content, and type are required');
    }

    const post = await createPost({
      userId: req.user.userId,
      title,
      content,
      type
    });

    res.status(201).json(serializePost(post));
  } catch (error) {
    next(error);
  }
}

async function getMyPostsHandler(req, res, next) {
  try {
    const posts = await getUserPosts(req.user.userId);

    res.json(posts.map(serializePost));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPostHandler,
  createMyPostHandler,
  getMyPostsHandler
};
