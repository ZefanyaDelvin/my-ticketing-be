const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');

router.get('/getAll', userController.getAllUsers);
router.post('/create', userController.createUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);

module.exports = router;
