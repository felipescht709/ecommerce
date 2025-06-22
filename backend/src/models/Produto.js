const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categoria = require('./Categoria'); 

const Produto = sequelize.define('Produto', {
    idProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_produto'
    },
    nomeProduto: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nome_produto'
    },
    imagemUrl: {
        type: DataTypes.STRING(2048),
        field: 'imagem_url'
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT
    },
    idCategoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_categoria',
        references: {
            model: Categoria, // Referencia o modelo Categoria
            key: 'id_categoria'
        }
    },
    quantidadeEstoque: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quantidade_estoque'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    idFornecedorExterno: {
        type: DataTypes.STRING(255),
        field: 'id_fornecedor_externo'
    },
    mediaAvaliacoes: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00,
        field: 'media_avaliacoes'
    },
    totalAvaliacoes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_avaliacoes'
    },
    dataCadastro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'data_cadastro'
    },
    dataAtualizacao: {
        type: DataTypes.DATE,
        field: 'data_atualizacao'
    }
}, {
    tableName: 'produto',
    timestamps: false // Gerenciaremos data_cadastro e data_atualizacao manualmente ou via hooks se necessário
});

// Define o relacionamento
Produto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
Categoria.hasMany(Produto, { foreignKey: 'id_categoria', as: 'produtos' });


module.exports = Produto;