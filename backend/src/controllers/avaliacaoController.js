// backend/src/controllers/avaliacaoController.js
const Avaliacao = require('../models/Avaliacao');
const Produto = require('../models/Produto');
const Usuario = require('../models/Usuario'); // Para obter nome do usuário na listagem

// Função auxiliar para recalcular a média de avaliações de um produto
async function recalcularMediaAvaliacoes(idProduto) {
    const avaliacoes = await Avaliacao.findAll({
        where: { idProduto: idProduto },
        attributes: ['nota']
    });

    if (avaliacoes.length === 0) {
        await Produto.update(
            { mediaAvaliacoes: 0.00, totalAvaliacoes: 0 },
            { where: { idProduto: idProduto } }
        );
        return;
    }

    const somaNotas = avaliacoes.reduce((sum, avaliacao) => sum + avaliacao.nota, 0);
    const media = somaNotas / avaliacoes.length;

    await Produto.update(
        { mediaAvaliacoes: parseFloat(media.toFixed(2)), totalAvaliacoes: avaliacoes.length },
        { where: { idProduto: idProduto } }
    );
}

exports.registrarAvaliacao = async (req, res) => {
    const { id: idProduto } = req.params;
    const { nota, comentario } = req.body;
    const idUsuario = req.usuario.id; // ID do usuário logado (cliente)

    if (!nota) {
        return res.status(400).json({ message: 'A nota é obrigatória.' });
    }
    if (nota < 1 || nota > 5) {
        return res.status(400).json({ message: 'A nota deve ser um valor entre 1 e 5.' });
    }
    if (comentario && comentario.length > 500) {
        return res.status(400).json({ message: 'O comentário não pode exceder 500 caracteres.' });
    }

    try {
        const produto = await Produto.findByPk(idProduto);
        if (!produto || !produto.ativo) {
            return res.status(404).json({ message: 'Produto não encontrado ou inativo.' });
        }

        // Verifica se o usuário já avaliou este produto
        const avaliacaoExistente = await Avaliacao.findOne({
            where: { idProduto: idProduto, idUsuario: idUsuario }
        });

        if (avaliacaoExistente) {
            return res.status(409).json({ message: 'Você já avaliou este produto. Considere editar sua avaliação existente.' });
        }

        const novaAvaliacao = await Avaliacao.create({
            idProduto,
            idUsuario,
            nota,
            comentario,
            dataAvaliacao: new Date()
        });

        // Recalcular média e total de avaliações do produto
        await recalcularMediaAvaliacoes(idProduto);

        res.status(201).json(novaAvaliacao);
    } catch (error) {
        console.error('Erro ao registrar avaliação:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.listarAvaliacoesProduto = async (req, res) => {
    const { id: idProduto } = req.params;

    try {
        const avaliacoes = await Avaliacao.findAll({
            where: { idProduto: idProduto },
            order: [['dataAvaliacao', 'DESC']],
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nomeUsuario'] // Inclui o nome do usuário que fez a avaliação
            }]
        });

        if (avaliacoes.length === 0) {
            return res.status(404).json({ message: 'Nenhuma avaliação encontrada para este produto.' });
        }

        // Mapeia para formatar a saída e esconder o idUsuario
        const avaliacoesFormatadas = avaliacoes.map(avaliacao => ({
            idAvaliacao: avaliacao.idAvaliacao,
            nota: avaliacao.nota,
            comentario: avaliacao.comentario,
            dataAvaliacao: avaliacao.dataAvaliacao,
            nomeCliente: avaliacao.usuario ? avaliacao.usuario.nomeUsuario : 'Anônimo' // Ou um identificador genérico
        }));

        res.json(avaliacoesFormatadas);
    } catch (error) {
        console.error('Erro ao listar avaliações:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.editarAvaliacao = async (req, res) => {
    const { id } = req.params; // ID da avaliação
    const { nota, comentario } = req.body;
    const idUsuarioLogado = req.usuario.id; // ID do usuário que fez a requisição

    if (!nota) {
        return res.status(400).json({ message: 'A nota é obrigatória.' });
    }
    if (nota < 1 || nota > 5) {
        return res.status(400).json({ message: 'A nota deve ser um valor entre 1 e 5.' });
    }
    if (comentario && comentario.length > 500) {
        return res.status(400).json({ message: 'O comentário não pode exceder 500 caracteres.' });
    }

    try {
        const avaliacao = await Avaliacao.findByPk(id);

        if (!avaliacao) {
            return res.status(404).json({ message: 'Avaliação não encontrada.' });
        }

        // Verifica se o usuário logado é o autor da avaliação
        if (avaliacao.idUsuario !== idUsuarioLogado) {
            return res.status(403).json({ message: 'Você não tem permissão para editar esta avaliação.' });
        }

        await avaliacao.update({ nota, comentario, dataAvaliacao: new Date() });

        // Recalcular média e total de avaliações do produto
        await recalcularMediaAvaliacoes(avaliacao.idProduto);

        res.json(avaliacao);
    } catch (error) {
        console.error('Erro ao editar avaliação:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.excluirAvaliacao = async (req, res) => {
    const { id } = req.params; // ID da avaliação
    const idUsuarioLogado = req.usuario.id; // ID do usuário que fez a requisição

    try {
        const avaliacao = await Avaliacao.findByPk(id);

        if (!avaliacao) {
            return res.status(404).json({ message: 'Avaliação não encontrada.' });
        }

        // Verifica se o usuário logado é o autor da avaliação
        if (avaliacao.idUsuario !== idUsuarioLogado) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir esta avaliação.' });
        }

        const idProdutoAfetado = avaliacao.idProduto;
        await avaliacao.destroy();

        // Recalcular média e total de avaliações do produto após a exclusão
        await recalcularMediaAvaliacoes(idProdutoAfetado);

        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};