// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); 

const sequelize = new Sequelize('ecommerce', 'postgres', 'postgres', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
}
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (error) {
        console.error('Não foi possível conectar ao banco de dados:', error);
        process.exit(1); 
    }
}

testConnection();

module.exports = sequelize;