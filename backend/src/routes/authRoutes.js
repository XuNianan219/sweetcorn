const express = require('express');
const requireAuth = require('../middleware/authMiddleware');

const { loginHandler, bindHandler } = require('../controllers/authController');

const router = express.Router();

router.post('/auth/login', loginHandler);
router.post('/auth/bind', requireAuth, bindHandler);

module.exports = router;
