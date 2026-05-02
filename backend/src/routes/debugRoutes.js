const express = require('express');
const { createEmptyUserHandler, setPhoneHandler } = require('../controllers/debugController');

const router = express.Router();

router.post('/debug/create-empty-user', createEmptyUserHandler);
router.post('/debug/set-phone', setPhoneHandler);

module.exports = router;
