// backend/src/routes/avaliacaoRoutes.js
const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const { autenticarToken } = require('../middleware/authMiddleware'); // Apenas autenticação, não precisa ser admin

// Rota para registrar uma nova avaliação para um produto específico
router.post('/:id/avaliacoes', autenticarToken, avaliacaoController.registrarAvaliacao);

// Rota para listar avaliações de um produto específico (pode ser pública)
router.get('/:id/avaliacoes', avaliacaoController.listarAvaliacoesProduto);

// Rota para editar uma avaliação específica (autenticado e deve ser o autor)
router.put('/:id', autenticarToken, avaliacaoController.editarAvaliacao);

// Rota para excluir uma avaliação específica (autenticado e deve ser o autor)
router.delete('/:id', autenticarToken, avaliacaoController.excluirAvaliacao);

module.exports = router;