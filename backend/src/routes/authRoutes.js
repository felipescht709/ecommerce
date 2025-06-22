// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
// Opcional: Rota para registro de admin (usar com cautela, talvez apenas para setup inicial)
// router.post('/register-admin', authController.registerAdmin);

module.exports = router;