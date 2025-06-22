// backend/src/models/ProdutoAtivoDetalhesView.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProdutoAtivoDetalhesView = sequelize.define('ProdutoAtivoDetalhesView', {
    idProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'id_produto'
    },
    nomeProduto: {
        type: DataTypes.STRING(255),
        field: 'nome_produto'
    },
    imagemUrl: {
        type: DataTypes.STRING(2048),
        field: 'imagem_url'
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2)
    },
    descricao: {
        type: DataTypes.TEXT
    },
    nomeCategoria: {
        type: DataTypes.STRING(255),
        field: 'nome_categoria'
    },
    quantidadeEstoque: {
        type: DataTypes.INTEGER,
        field: 'quantidade_estoque'
    },
    mediaAvaliacoes: {
        type: DataTypes.DECIMAL(3, 2),
        field: 'media_avaliacoes'
    },
    totalAvaliacoes: {
        type: DataTypes.INTEGER,
        field: 'total_avaliacoes'
    },
    dataCadastro: {
        type: DataTypes.DATE,
        field: 'data_cadastro'
    }
}, {
    tableName: 'vw_produtos_ativos_detalhes', // Nome da VIEW no banco de dados
    timestamps: false,
    freezeTableName: true // Impede que o Sequelize pluralize o nome da tabela
});

module.exports = ProdutoAtivoDetalhesView;