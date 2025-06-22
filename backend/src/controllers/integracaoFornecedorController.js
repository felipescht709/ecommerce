const fornecedorService = require('../services/FornecedorService');

exports.sincronizarFornecedor = async (req, res) => {
    const idUsuarioAdmin = req.usuario.id; // ID do administrador que iniciou a sincronização

    try {
        const resultado = await fornecedorService.sincronizarProdutosComFornecedor(idUsuarioAdmin);
        res.json({ message: resultado.message, stats: resultado.stats });
    } catch (error) {
        console.error('Erro na requisição de sincronização:', error);
        res.status(500).json({ message: error.message || 'Falha na sincronização com o fornecedor.' });
    }
};