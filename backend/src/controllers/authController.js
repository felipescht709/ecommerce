// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const Usuario = require('../models/Usuario');

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        const isMatch = await usuario.compararSenha(senha);

        if (!isMatch) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

        // Atualiza a data do último login
        usuario.dataUltimoLogin = new Date();
        await usuario.save();

        const token = jwt.sign(
            { id: usuario.idUsuario, isAdmin: usuario.isAdmin },
            authConfig.jwtSecret,
            { expiresIn: authConfig.jwtExpiresIn }
        );

        res.json({ token, isAdmin: usuario.isAdmin, nomeUsuario: usuario.nomeUsuario });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Opcional: Adicionar um endpoint para registro de admin (apenas para setup inicial)
exports.registerAdmin = async (req, res) => {
    const { nomeUsuario, email, senha } = req.body;

    if (!nomeUsuario || !email || !senha) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        const existingUser = await Usuario.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const newUser = await Usuario.create({
            nomeUsuario,
            email,
            senhaHash: senha, // O hook beforeCreate vai hashear
            isAdmin: true // Novo usuário será um administrador
        });

        res.status(201).json({ message: 'Administrador registrado com sucesso!', idUsuario: newUser.idUsuario });
    } catch (error) {
        console.error('Erro ao registrar administrador:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar administrador.' });
    }
};