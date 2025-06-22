const axios = require('axios');
const IntegracaoFornecedor = require('../models/IntegracaoFornecedor');
const Produto = require('../models/Produto');
const LogAuditoria = require('../models/LogAuditoria');
const sequelize = require('../config/database');

async function sincronizarProdutosComFornecedor(idUsuarioAdmin) {
    const transaction = await sequelize.transaction();
    try {
        const configIntegracao = await IntegracaoFornecedor.findOne({ transaction }); // Pega a primeira configuração ou específica se tiver múltiplas
        
        if (!configIntegracao) {
            throw new Error('Configuração de integração com fornecedor não encontrada.');
        }

        const { endpointAPI, chaveAutenticacao } = configIntegracao;

        // Requisição à API do fornecedor
        const response = await axios.get(endpointAPI, {
            headers: {
                'Authorization': `Bearer ${chaveAutenticacao}`
            }
        });

        const produtosFornecedor = response.data; // Assumindo que a API retorna um array de produtos

        let produtosAtualizados = 0;
        let produtosCriados = 0;
        let logDetalhes = [];

        for (const produtoData of produtosFornecedor) {
            const { idExterno, nome, preco, descricao, idCategoriaExterna, quantidadeEstoque, imagemUrl } = produtoData;

            // Busca por um produto existente usando id_fornecedor_externo
            let produtoExistente = await Produto.findOne({
                where: { idFornecedorExterno: idExterno },
                transaction
            });

            // Encontra a categoria correspondente no seu sistema (ou cria se não existir)
            let categoria = await Categoria.findOne({
                where: { nomeCategoria: produtoData.nomeCategoria }, // Assumindo que o fornecedor envia o nome da categoria
                transaction
            });

            if (!categoria) {
                // Se a categoria não existir, você pode optar por criá-la
                categoria = await Categoria.create({ nomeCategoria: produtoData.nomeCategoria }, { transaction });
                logDetalhes.push(`Categoria "${produtoData.nomeCategoria}" criada para o produto ${nome}.`);
            }

            if (produtoExistente) {
                // Atualizar produto existente
                const isChanged = 
                    produtoExistente.nomeProduto !== nome ||
                    parseFloat(produtoExistente.preco) !== parseFloat(preco) || // Comparar como float
                    produtoExistente.quantidadeEstoque !== quantidadeEstoque ||
                    produtoExistente.descricao !== descricao ||
                    produtoExistente.imagemUrl !== imagemUrl ||
                    produtoExistente.idCategoria !== categoria.idCategoria;

                if (isChanged) {
                    await produtoExistente.update({
                        nomeProduto: nome,
                        preco: preco,
                        descricao: descricao,
                        idCategoria: categoria.idCategoria,
                        quantidadeEstoque: quantidadeEstoque,
                        imagemUrl: imagemUrl,
                        dataAtualizacao: new Date()
                    }, { transaction });
                    produtosAtualizados++;
                    logDetalhes.push(`Produto "${nome}" (ID Externo: ${idExterno}) atualizado.`);
                }
            } else {
                // Criar novo produto
                await Produto.create({
                    nomeProduto: nome,
                    imagemUrl: imagemUrl,
                    preco: preco,
                    descricao: descricao,
                    idCategoria: categoria.idCategoria,
                    quantidadeEstoque: quantidadeEstoque,
                    ativo: true,
                    idFornecedorExterno: idExterno,
                    dataCadastro: new Date()
                }, { transaction });
                produtosCriados++;
                logDetalhes.push(`Novo produto "${nome}" (ID Externo: ${idExterno}) criado.`);
            }
        }

        // Atualiza a data da última sincronização
        await configIntegracao.update({ ultimaSincronizacao: new Date() }, { transaction });

        // Registra o log de auditoria
        await LogAuditoria.create({
            tipoEntidade: 'integracao_fornecedor',
            idEntidadeAfetada: configIntegracao.idIntegracaoFornecedor,
            tipoOperacao: 'SINCRONIZACAO',
            dataHora: new Date(),
            idUsuario: idUsuarioAdmin,
            detalhes: `Sincronização com fornecedor concluída. ${produtosCriados} produtos criados, ${produtosAtualizados} produtos atualizados. Detalhes: ${logDetalhes.join('; ')}`
        }, { transaction });

        await transaction.commit();
        return {
            success: true,
            message: `Sincronização com fornecedor concluída: ${produtosCriados} produtos criados, ${produtosAtualizados} produtos atualizados.`,
            stats: { produtosCriados, produtosAtualizados }
        };

    } catch (error) {
        await transaction.rollback();
        console.error('Erro na sincronização com fornecedor:', error.message);
        // Registra log de erro na auditoria, se possível, ou em um log de sistema separado
        if (idUsuarioAdmin) { // Se tiver o ID do usuário admin, registra o erro no log de auditoria
             await LogAuditoria.create({
                tipoEntidade: 'integracao_fornecedor',
                idEntidadeAfetada: 0, // Ou ID da config se souber
                tipoOperacao: 'ERRO_SINCRONIZACAO',
                dataHora: new Date(),
                idUsuario: idUsuarioAdmin,
                detalhes: `Erro na sincronização com fornecedor: ${error.message}`
            }).catch(logError => console.error('Erro ao registrar log de auditoria de erro:', logError));
        }
        throw new Error(`Falha na sincronização com fornecedor: ${error.message}`);
    }
}

module.exports = {
    sincronizarProdutosComFornecedor
};