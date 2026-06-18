const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');

const {
  createUserHandler,
  getUserPostsHandler,
  getMeHandler,
  updateMeHandler
} = require('../controllers/usersController');

const router = express.Router();

router.get('/users/me', requireAuth, getMeHandler);
router.put('/users/me', requireAuth, updateMeHandler);
router.post('/users', createUserHandler);
router.get('/users/:id/posts', getUserPostsHandler);

module.exports = router;
