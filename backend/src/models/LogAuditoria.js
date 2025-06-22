// backend/src/models/LogAuditoria.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario'); // Importa o modelo Usuario

const LogAuditoria = sequelize.define('LogAuditoria', {
    idLogAuditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_log_auditoria'
    },
    tipoEntidade: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'tipo_entidade'
    },
    idEntidadeAfetada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_entidade_afetada'
    },
    tipoOperacao: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'tipo_operacao'
    },
    dataHora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'data_hora'
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
    detalhes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'log_auditoria',
    timestamps: false
});

// Define o relacionamento
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario', as: 'logs_auditoria' });

module.exports = LogAuditoria;