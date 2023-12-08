const express = require('express');
const router = express.Router();
const authenticationController = require('../controllers/authenticationController');

router.post('/login', authenticationController.login);
router.post('/validate-token', authenticationController.validateToken);

module.exports = router;
