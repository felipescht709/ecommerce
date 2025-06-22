// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const Usuario = require('../models/Usuario'); // Para verificar se o usuário ainda existe

// Middleware para autenticar o token JWT
exports.autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Espera "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, authConfig.jwtSecret, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        
        try {
            const usuario = await Usuario.findByPk(decoded.id);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            req.usuario = {
                id: usuario.idUsuario,
                isAdmin: usuario.isAdmin
            }; // Adiciona informações do usuário à requisição
            next();
        } catch (error) {
            console.error('Erro ao verificar usuário do token:', error);
            res.status(500).json({ message: 'Erro interno ao autenticar token.' });
        }
    });
};

// Middleware para autorizar acesso apenas a administradores
exports.autorizarAdmin = (req, res, next) => {
    if (!req.usuario || !req.usuario.isAdmin) {
        return res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
    next();
};