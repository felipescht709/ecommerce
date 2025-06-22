// backend/src/config/auth.js
require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'osgurisaoruim',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};