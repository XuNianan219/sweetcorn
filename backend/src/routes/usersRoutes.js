const express = require('express');

const {
  createUserHandler,
  getUserPostsHandler
} = require('../controllers/usersController');

const router = express.Router();

router.post('/users', createUserHandler);
router.get('/users/:id/posts', getUserPostsHandler);

module.exports = router;
