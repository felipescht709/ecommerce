const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    idUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_usuario'
    },
    nomeUsuario: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nome_usuario'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    senhaHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'senha_hash'
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_admin'
    },
    dataCadastro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'data_cadastro'
    },
    dataUltimoLogin: {
        type: DataTypes.DATE,
        field: 'data_ultimo_login'
    }
}, {
    tableName: 'usuario',
    timestamps: false,
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.senhaHash) {
                const salt = await bcrypt.genSalt(10);
                usuario.senhaHash = await bcrypt.hash(usuario.senhaHash, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('senhaHash')) { 
                const salt = await bcrypt.genSalt(10);
                usuario.senhaHash = await bcrypt.hash(usuario.senhaHash, salt);
            }
        }
    }
});

Usuario.prototype.compararSenha = async function(senhaFornecida) {
    return await bcrypt.compare(senhaFornecida, this.senhaHash);
};

module.exports = Usuario;