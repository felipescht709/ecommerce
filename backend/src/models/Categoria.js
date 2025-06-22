const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = sequelize.define('Categoria', {
    idCategoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_categoria'
    },
    nomeCategoria: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'nome_categoria'
    }
}, {
    tableName: 'categoria', 
    timestamps: false 
});

module.exports = Categoria;