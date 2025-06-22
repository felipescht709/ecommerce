// backend/src/controllers/categoriaController.js
const Categoria = require('../models/Categoria');

exports.listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll();
        res.json(categorias);
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.cadastrarCategoria = async (req, res) => {
    const { nomeCategoria } = req.body;

    if (!nomeCategoria) {
        return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }

    try {
        const novaCategoria = await Categoria.create({ nomeCategoria });
        res.status(201).json(novaCategoria);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Já existe uma categoria com este nome.' });
        }
        console.error('Erro ao cadastrar categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};