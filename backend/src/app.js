require('dotenv').config(); // Carrega as variáveis de ambiente primeiro
const express = require('express');
const cors = require('cors'); // Para permitir requisições do front-end
const sequelize = require('./config/database'); // Importa a conexão com o banco de dados

// Importa as rotas
const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const integracaoFornecedorRoutes = require('./routes/integracaoFornecedorRoutes');
const ProdutoAtivoDetalhesView = require('./models/ProdutoAtivoDetalhesView');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Habilita o CORS para todas as origens (ajuste em produção para domínios específicos)
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes); 
app.use('/api/integracao/fornecedor', integracaoFornecedorRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.send('API de Cadastro de Produtos está rodando!');
});

// Sincroniza os modelos com o banco de dados
// CUIDADO: `alter: true` em produção pode ser perigoso para dados existentes
// Em ambiente de desenvolvimento, `force: true` recria as tabelas (perde dados)
// Em produção, use ferramentas de migração (Sequelize CLI)
sequelize.sync({ alter: true }) // Isso tenta fazer alterações no DB para corresponder aos modelos
    .then(() => {
        console.log('Modelos sincronizados com o banco de dados.');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao sincronizar modelos com o banco de dados:', err);
        process.exit(1);
    });

module.exports = app; 