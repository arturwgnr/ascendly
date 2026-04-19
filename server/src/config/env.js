require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    refreshExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10),
  },
};
