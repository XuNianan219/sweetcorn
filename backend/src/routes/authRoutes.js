const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { registerHandler, loginHandler, bindHandler } = require('../controllers/authController');

const router = express.Router();

router.post('/auth/register', registerHandler);
router.post('/auth/login', loginHandler);
router.post('/auth/bind', requireAuth, bindHandler);

module.exports = router;
