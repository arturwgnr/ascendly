const jwt = require('jsonwebtoken');
const { jwt: cfg } = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, cfg.accessSecret, { expiresIn: cfg.accessExpires });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, cfg.refreshSecret, {
    expiresIn: `${cfg.refreshExpiresDays}d`,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, cfg.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, cfg.refreshSecret);
}

function refreshTokenExpiry() {
  return new Date(Date.now() + cfg.refreshExpiresDays * 24 * 60 * 60 * 1000);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenExpiry,
};
