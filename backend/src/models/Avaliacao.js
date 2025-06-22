// backend/src/models/Avaliacao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./Produto'); // Importa o modelo Produto
const Usuario = require('./Usuario'); // Importa o modelo Usuario

const Avaliacao = sequelize.define('Avaliacao', {
    idAvaliacao: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_avaliacao'
    },
    idProduto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_produto',
        references: {
            model: Produto,
            key: 'id_produto'
        }
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_usuario',
        references: {
            model: Usuario,
            key: 'id_usuario'
        }
    },
    nota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comentario: {
        type: DataTypes.TEXT
    },
    dataAvaliacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'data_avaliacao'
    }
}, {
    tableName: 'avaliacao',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['id_usuario', 'id_produto'],
            name: 'UQ_avaliacao_usuario_produto' // Nome do índice UNIQUE
        }
    ]
});

// Define os relacionamentos
Avaliacao.belongsTo(Produto, { foreignKey: 'id_produto', as: 'produto' });
Produto.hasMany(Avaliacao, { foreignKey: 'id_produto', as: 'avaliacoes' });

Avaliacao.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasMany(Avaliacao, { foreignKey: 'id_usuario', as: 'avaliacoes' });


module.exports = Avaliacao;