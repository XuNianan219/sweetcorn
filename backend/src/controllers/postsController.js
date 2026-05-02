const {
  createPost,
  findPostById,
  updatePost,
  deletePost,
  getPosts,
  getPostById,
} = require('../services/postsService');
const { serializePost } = require('../services/serializers');
const { getUserPosts } = require('../services/usersService');
const { deleteFromR2 } = require('../utils/upload');

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

const ALLOWED_POST_CATEGORIES = new Set([
  'life',
  'fanfic',
  'discussion',
  'media',
  'article',
  'travel',
]);

function normalizeTitle(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function extractHashtagsFromContent(content) {
  if (!content) {
    return [];
  }

  const matches = content.match(/#([^\s#]+)/gu) || [];

  return Array.from(
    new Set(matches.map((tag) => tag.slice(1).trim()).filter(Boolean))
  );
}

function normalizeHashtags(value, content) {
  if (value === undefined) {
    return extractHashtagsFromContent(content);
  }

  if (!Array.isArray(value)) {
    const error = new Error('hashtags must be an array of strings');
    error.statusCode = 400;
    throw error;
  }

  const hashtags = value
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (hashtags.length !== value.length) {
    const error = new Error('hashtags must be an array of strings');
    error.statusCode = 400;
    throw error;
  }

  return Array.from(new Set(hashtags));
}

function normalizeCategory(value, { required = false } = {}) {
  const category = normalizeOptionalString(value);

  if (!category) {
    if (required) {
      const error = new Error('category is required');
      error.statusCode = 400;
      throw error;
    }

    return undefined;
  }

  if (!ALLOWED_POST_CATEGORIES.has(category)) {
    const error = new Error('category must be one of: life, fanfic, discussion, media, article, travel');
    error.statusCode = 400;
    throw error;
  }

  return category;
}

// 校验并提取 mediaUrls 和 mediaType
function normalizeMedia(body) {
  const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
  const ALLOWED_MEDIA_TYPES = ['image', 'video', 'none'];
  const mediaType = ALLOWED_MEDIA_TYPES.includes(body.mediaType) ? body.mediaType : 'none';
  return { mediaUrls, mediaType };
}

async function createPostHandler(req, res, next) {
  try {
    const title = normalizeTitle(req.body.title);
    const content = normalizeRequiredString(req.body.content);
    const type = normalizeOptionalString(req.body.type) || 'text';
    const category = normalizeCategory(req.body.category, { required: true });
    const hashtags = normalizeHashtags(req.body.hashtags, content);
    const { mediaUrls, mediaType } = normalizeMedia(req.body);

    if (!content) {
      res.status(400);
      throw new Error('content is required');
    }

    const post = await createPost({
      authorId: req.user.userId,
      title,
      content,
      type,
      category,
      hashtags,
      mediaUrls,
      mediaType,
    });

    res.status(201).json(serializePost(post));
  } catch (error) {
    next(error);
  }
}

async function createMyPostHandler(req, res, next) {
  try {
    const title = normalizeTitle(req.body.title);
    const content = normalizeRequiredString(req.body.content);
    const type = normalizeOptionalString(req.body.type) || 'text';
    const category = normalizeCategory(req.body.category, { required: true });
    const hashtags = normalizeHashtags(req.body.hashtags, content);
    const { mediaUrls, mediaType } = normalizeMedia(req.body);

    if (!content) {
      res.status(400);
      throw new Error('content is required');
    }

    const post = await createPost({
      authorId: req.user.userId,
      title,
      content,
      type,
      category,
      hashtags,
      mediaUrls,
      mediaType,
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
async function getPostsHandler(req, res, next) {
  try {
    const { category } = req.query;
    // 如果请求已通过认证，则传入 viewerUserId，使返回结果带上 isLikedByMe
    const viewerUserId = req.user ? req.user.userId : undefined;
    const posts = await getPosts({ category, viewerUserId });
    res.json(posts.map(serializePost));
  } catch (error) {
    next(error);
  }
}


// 获取单个帖子详情（带 likeCount / isLikedByMe）
async function getPostByIdHandler(req, res, next) {
  try {
    const viewerUserId = req.user ? req.user.userId : undefined;
    const post = await getPostById(req.params.id, { viewerUserId });
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }
    res.json(serializePost(post));
  } catch (error) {
    next(error);
  }
}

async function updatePostHandler(req, res, next) {
  try {
    const post = await findPostById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }

    if (post.authorId !== req.user.userId) {
      res.status(403);
      throw new Error('没有权限');
    }

    const payload = {};

    if (req.body.title !== undefined) {
      payload.title = normalizeTitle(req.body.title);
    }

    if (req.body.content !== undefined) {
      payload.content = normalizeRequiredString(req.body.content);

      if (!payload.content) {
        res.status(400);
        throw new Error('content cannot be empty');
      }
    }

    if (req.body.type !== undefined) {
      payload.type = normalizeOptionalString(req.body.type) || '';
    }

    if (req.body.category !== undefined) {
      payload.category = normalizeCategory(req.body.category, { required: true });
    }

    if (req.body.hashtags !== undefined || payload.content !== undefined) {
      payload.hashtags = normalizeHashtags(req.body.hashtags, payload.content ?? post.content);
    }

    if (Object.keys(payload).length === 0) {
      res.status(400);
      throw new Error('No valid fields provided for update');
    }

    const updatedPost = await updatePost({
      postId: req.params.id,
      ...payload
    });

    res.json(serializePost(updatedPost));
  } catch (error) {
    next(error);
  }
}

async function deletePostHandler(req, res, next) {
  try {
    const post = await findPostById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }

    if (post.authorId !== req.user.userId) {
      res.status(403);
      throw new Error('没有权限');
    }

    // 删帖前清理 R2 上的媒体文件（失败不阻止删帖）
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      const publicUrl = process.env.R2_PUBLIC_URL || '';
      for (const url of post.mediaUrls) {
        try {
          const key = url.replace(`${publicUrl}/`, '');
          await deleteFromR2(key);
        } catch (err) {
          console.error('R2 媒体删除失败:', url, err);
        }
      }
    }

    await deletePost(req.params.id);

    res.json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPostHandler,
  createMyPostHandler,
  getMyPostsHandler,
  updatePostHandler,
  deletePostHandler,
  getPostsHandler,
  getPostByIdHandler,
};
