// backend/src/controllers/produtoController.js
const { Op } = require('sequelize');
const Produto = require('../models/Produto');
const Categoria = require('../models/Categoria');
const Avaliacao = require('../models/Avaliacao');
const LogAuditoria = require('../models/LogAuditoria');
const ProdutoAtivoDetalhesView = require('../models/ProdutoAtivoDetalhesView'); // Importe a VIEW
const Usuario = require('../models/Usuario'); // Necessário para include na avaliação
const sequelize = require('../config/database'); // Importa a instância do Sequelize

exports.cadastrarProduto = async (req, res) => {
    const { nomeProduto, imagemUrl, preco, descricao, idCategoria, quantidadeEstoque } = req.body;
    const idUsuarioAdmin = req.usuario.id; // Vem do middleware de autenticação

    // Validações básicas de entrada
    if (!nomeProduto || !preco || !idCategoria || quantidadeEstoque === undefined) {
        return res.status(400).json({ message: 'Nome, preço, categoria e quantidade em estoque são obrigatórios.' });
    }
    if (isNaN(parseFloat(preco)) || preco <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }
    if (isNaN(parseInt(quantidadeEstoque)) || parseInt(quantidadeEstoque) < 0) {
        return res.status(400).json({ message: 'Quantidade em estoque deve ser um número não negativo.' });
    }
    if (isNaN(parseInt(idCategoria))) {
        return res.status(400).json({ message: 'ID da categoria inválido.' });
    }

    const transaction = await sequelize.transaction();
    try {
        const categoria = await Categoria.findByPk(idCategoria, { transaction });
        if (!categoria) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        const novoProduto = await Produto.create({
            nomeProduto,
            imagemUrl,
            preco: parseFloat(preco), // Garante que o preço seja um float
            descricao,
            idCategoria,
            quantidadeEstoque: parseInt(quantidadeEstoque), // Garante que o estoque seja um int
            ativo: true,
            dataCadastro: new Date()
        }, { transaction });

        await LogAuditoria.create({
            tipoEntidade: 'produto',
            idEntidadeAfetada: novoProduto.idProduto,
            tipoOperacao: 'CADASTRO',
            dataHora: new Date(),
            idUsuario: idUsuarioAdmin,
            detalhes: `Produto "${novoProduto.nomeProduto}" cadastrado.`
        }, { transaction });

        await transaction.commit();
        res.status(201).json(novoProduto);
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao cadastrar produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar produto.' });
    }
};

exports.editarProduto = async (req, res) => {
    const { id } = req.params;
    const { nomeProduto, imagemUrl, preco, descricao, idCategoria, quantidadeEstoque, ativo } = req.body;
    const idUsuarioAdmin = req.usuario.id;

    // Validações para campos que podem ser alterados
    if (preco !== undefined && (isNaN(parseFloat(preco)) || parseFloat(preco) <= 0)) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
    }
    if (quantidadeEstoque !== undefined && (isNaN(parseInt(quantidadeEstoque)) || parseInt(quantidadeEstoque) < 0)) {
        return res.status(400).json({ message: 'Quantidade em estoque deve ser um número não negativo.' });
    }
    if (idCategoria !== undefined && isNaN(parseInt(idCategoria))) {
        return res.status(400).json({ message: 'ID da categoria inválido.' });
    }
    if (ativo !== undefined && typeof ativo !== 'boolean') {
        return res.status(400).json({ message: 'O campo "ativo" deve ser um booleano.' });
    }

    const transaction = await sequelize.transaction();
    try {
        const produto = await Produto.findByPk(id, { transaction });
        if (!produto) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Verifica se a categoria existe, se idCategoria foi fornecido para atualização
        if (idCategoria !== undefined) {
            const categoria = await Categoria.findByPk(idCategoria, { transaction });
            if (!categoria) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Categoria não encontrada.' });
            }
        }

        const oldProdutoData = produto.toJSON(); // Copia os dados antigos para o log

        // Prepara os dados para atualização, garantindo que apenas campos fornecidos sejam atualizados
        const updateData = { dataAtualizacao: new Date() };
        if (nomeProduto !== undefined) updateData.nomeProduto = nomeProduto;
        if (imagemUrl !== undefined) updateData.imagemUrl = imagemUrl;
        if (preco !== undefined) updateData.preco = parseFloat(preco);
        if (descricao !== undefined) updateData.descricao = descricao;
        if (idCategoria !== undefined) updateData.idCategoria = idCategoria;
        if (quantidadeEstoque !== undefined) updateData.quantidadeEstoque = parseInt(quantidadeEstoque);
        if (ativo !== undefined) updateData.ativo = ativo;

        await produto.update(updateData, { transaction });

        // Monta os detalhes para o log de auditoria
        const changedFields = {};
        for (const key in updateData) {
            // Verifica se a chave existe nos dados antigos (importante para evitar logar campos internos do sequelize)
            if (oldProdutoData.hasOwnProperty(key) && updateData[key] !== oldProdutoData[key]) {
                changedFields[key] = {
                    old: oldProdutoData[key],
                    new: updateData[key]
                };
            }
        }
        // Excluir dataAtualizacao do log de changedFields se não for relevante para o front
        delete changedFields.dataAtualizacao;

        await LogAuditoria.create({
            tipoEntidade: 'produto',
            idEntidadeAfetada: produto.idProduto,
            tipoOperacao: 'EDICAO',
            dataHora: new Date(),
            idUsuario: idUsuarioAdmin,
            detalhes: `Produto "${produto.nomeProduto}" (ID: ${produto.idProduto}) editado. Campos alterados: ${JSON.stringify(changedFields)}`
        }, { transaction });

        await transaction.commit();
        res.json(produto);
    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao editar produto:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao editar produto.' });
    }
};

exports.desativarProduto = async (req, res) => {
    const { id } = req.params;
    const idUsuarioAdmin = req.usuario.id;

    if (isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'ID do produto inválido.' });
    }

    try {
        // Chama a stored procedure
        await sequelize.query(
            'CALL sp_desativar_produto(:p_id_produto, :p_id_usuario_responsavel)',
            {
                replacements: {
                    p_id_produto: id,
                    p_id_usuario_responsavel: idUsuarioAdmin
                },
                type: sequelize.QueryTypes.RAW // RAW para SPs que não retornam um SELECT
            }
        );

        // A stored procedure já lida com a lógica de verificação e log de auditoria
        res.json({ message: 'Produto desativado com sucesso (exclusão lógica).' });

    } catch (error) {
        console.error('Erro ao desativar produto (via SP):', error);
        // A SP pode retornar uma mensagem de erro específica via SIGNAL SQLSTATE
        // Tentamos extrair a mensagem do SIGNAL, caso contrário, uma genérica.
        const errorMessage = error.message.includes('Produto não encontrado.') ?
                             'Produto não encontrado.' :
                             'Erro interno do servidor ao desativar produto. Detalhes: ' + error.message;
        res.status(500).json({ message: errorMessage });
    }
};

exports.listarProdutos = async (req, res) => {
    const { nome, categoria, preco_min, preco_max, ordenar_por, ordem, pagina = 1, limite = 10 } = req.query;

    const whereClause = {}; // A view já filtra por ativo = TRUE
    const orderClause = [];

    // Validar e converter parâmetros de paginação e limite
    const page = parseInt(pagina);
    const limit = parseInt(limite);
    if (isNaN(page) || page < 1) return res.status(400).json({ message: 'Parâmetro de página inválido.' });
    if (isNaN(limit) || limit < 1) return res.status(400).json({ message: 'Parâmetro de limite inválido.' });

    if (nome) {
        whereClause.nomeProduto = { [Op.like]: `%${nome}%` };
    }
    if (categoria) {
        // Filtra direto pelo nome da categoria na view
        whereClause.nomeCategoria = { [Op.like]: `%${categoria}%` };
    }
    if (preco_min || preco_max) {
        whereClause.preco = {};
        if (preco_min) {
            const min = parseFloat(preco_min);
            if (isNaN(min) || min < 0) return res.status(400).json({ message: 'Preço mínimo inválido.' });
            whereClause.preco[Op.gte] = min;
        }
        if (preco_max) {
            const max = parseFloat(preco_max);
            if (isNaN(max) || max < 0) return res.status(400).json({ message: 'Preço máximo inválido.' });
            whereClause.preco[Op.lte] = max;
        }
    }

    // Ordenação
    if (ordenar_por) {
        switch (ordenar_por.toLowerCase()) {
            case 'preco':
                orderClause.push(['preco', ordem && ordem.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
                break;
            case 'avaliacao':
                orderClause.push(['mediaAvaliacoes', ordem && ordem.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
                break;
            case 'data_cadastro':
                 orderClause.push(['dataCadastro', ordem && ordem.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
                 break;
            default:
                // Se ordenar_por for inválido, podemos retornar um erro ou ignorar
                // return res.status(400).json({ message: 'Critério de ordenação inválido.' });
                break;
        }
    }

    const offset = (page - 1) * limit;

    try {
        // Agora consultamos a VIEW em vez da tabela Produto diretamente
        const { count, rows } = await ProdutoAtivoDetalhesView.findAndCountAll({
            where: whereClause,
            order: orderClause.length > 0 ? orderClause : [['dataCadastro', 'DESC']], // Ordenação padrão
            limit: limit,
            offset: offset
        });

        if (count === 0 && (nome || categoria || preco_min || preco_max)) {
            return res.status(200).json({
                message: 'Nenhum produto encontrado com os critérios de busca e filtro fornecidos. Tente redefinir os critérios.',
                totalProdutos: 0,
                paginaAtual: page,
                produtosPorPagina: limit,
                totalPaginas: 0,
                produtos: []
            });
        }

        res.json({
            totalProdutos: count,
            paginaAtual: page,
            produtosPorPagina: limit,
            totalPaginas: Math.ceil(count / limit),
            produtos: rows
        });
    } catch (error) {
        console.error('Erro ao listar produtos (via VIEW):', error);
        res.status(500).json({ message: 'Erro interno do servidor ao listar produtos.' });
    }
};

exports.obterProdutoPorId = async (req, res) => {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'ID do produto inválido.' });
    }

    try {
        // Para detalhes de um único produto, ainda é melhor usar o modelo Produto
        // para aproveitar os includes de avaliações, que não estão na view
        const produto = await Produto.findOne({
            where: { idProduto: id, ativo: true },
            include: [
                { model: Categoria, as: 'categoria', attributes: ['nomeCategoria'] },
                {
                    model: Avaliacao,
                    as: 'avaliacoes',
                    attributes: ['nota', 'comentario', 'dataAvaliacao', 'idUsuario'],
                    include: [{
                        model: Usuario, // Inclui o modelo Usuario para obter o nome do avaliador
                        as: 'usuario',
                        attributes: ['nomeUsuario']
                    }]
                }
            ]
        });

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado ou inativo.' });
        }

        // Formata as avaliações para incluir o nome do cliente
        const produtoFormatado = {
            ...produto.toJSON(),
            avaliacoes: produto.avaliacoes.map(avaliacao => ({
                idAvaliacao: avaliacao.idAvaliacao,
                nota: avaliacao.nota,
                comentario: avaliacao.comentario,
                dataAvaliacao: avaliacao.dataAvaliacao,
                nomeCliente: avaliacao.usuario ? avaliacao.usuario.nomeUsuario : 'Anônimo' // Usa o nome do usuário da avaliação
            }))
        };

        res.json(produtoFormatado);
    } catch (error) {
        console.error('Erro ao obter produto por ID:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao obter detalhes do produto.' });
    }
};