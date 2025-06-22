const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IntegracaoFornecedor = sequelize.define('IntegracaoFornecedor', {
    idIntegracaoFornecedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_integracao_fornecedor'
    },
    nomeFornecedor: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nome_fornecedor'
    },
    endpointAPI: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        field: 'endpoint_api'
    },
    chaveAutenticacao: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'chave_autenticacao'
    },
    ultimaSincronizacao: {
        type: DataTypes.DATE,
        field: 'ultima_sincronizacao'
    }
}, {
    tableName: 'integracao_fornecedor',
    timestamps: false
});

module.exports = IntegracaoFornecedor;