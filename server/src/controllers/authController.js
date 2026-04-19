const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiry,
} = require('../utils/jwt');
const { jwt: cfg } = require('../config/env');

const prisma = new PrismaClient();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: cfg.refreshExpiresDays * 24 * 60 * 60 * 1000,
};

const DEFAULT_PILLARS = ['Exercise', 'Deep Work', 'Reading'];

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    await prisma.pillar.createMany({
      data: DEFAULT_PILLARS.map((label, i) => ({ userId: user.id, label, order: i })),
    });
    await prisma.gamification.create({ data: { userId: user.id } });
    await prisma.userSettings.create({ data: { userId: user.id } });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.status(201).json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry() },
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
    res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalid or expired' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Refresh token invalid' });
    }

    await prisma.refreshToken.delete({ where: { token } });

    const newAccessToken = signAccessToken({ userId: payload.userId });
    const newRefreshToken = signRefreshToken({ userId: payload.userId });

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.userId, expiresAt: refreshTokenExpiry() },
    });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTS);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
