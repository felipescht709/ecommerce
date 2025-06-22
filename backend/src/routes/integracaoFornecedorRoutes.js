// backend/src/routes/integracaoFornecedorRoutes.js
const express = require('express');
const router = express.Router();
const integracaoFornecedorController = require('../controllers/integracaoFornecedorController');
const { autenticarToken, autorizarAdmin } = require('../middleware/authMiddleware');

router.post('/sincronizar', autenticarToken, autorizarAdmin, integracaoFornecedorController.sincronizarFornecedor);

module.exports = router;