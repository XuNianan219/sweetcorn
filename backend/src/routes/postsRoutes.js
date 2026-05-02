const express = require('express');
const requireAuth = require('../middleware/authMiddleware');

const {
  createPostHandler,
  createMyPostHandler,
  getMyPostsHandler,
  updatePostHandler,
  deletePostHandler,
  getPostsHandler,
  getPostByIdHandler,
} = require('../controllers/postsController');

const router = express.Router();
router.get('/posts', requireAuth, getPostsHandler);
router.get('/posts/:id', requireAuth, getPostByIdHandler);
router.post('/posts', requireAuth, createPostHandler);
router.put('/posts/:id', requireAuth, updatePostHandler);
router.delete('/posts/:id', requireAuth, deletePostHandler);
router.post('/me/posts', requireAuth, createMyPostHandler);
router.get('/me/posts', requireAuth, getMyPostsHandler);

module.exports = router;
