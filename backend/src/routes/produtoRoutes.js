// backend/src/routes/produtoRoutes.js
const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { autenticarToken, autorizarAdmin } = require('../middleware/authMiddleware');

router.post('/', autenticarToken, autorizarAdmin, produtoController.cadastrarProduto);
router.put('/:id', autenticarToken, autorizarAdmin, produtoController.editarProduto);
router.delete('/:id', autenticarToken, autorizarAdmin, produtoController.desativarProduto);
router.get('/', produtoController.listarProdutos); // Público (com filtros para API cliente)
router.get('/:id', produtoController.obterProdutoPorId); // Público (detalhes do produto)

module.exports = router;