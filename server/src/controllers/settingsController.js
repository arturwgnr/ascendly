const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSettings(req, res, next) {
  try {
    const [settings, pillars] = await Promise.all([
      prisma.userSettings.findUnique({ where: { userId: req.userId } }),
      prisma.pillar.findMany({ where: { userId: req.userId }, orderBy: { order: 'asc' } }),
    ]);
    res.json({ settings, pillars });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { themeOverrides, timezone } = req.body;
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: { themeOverrides, timezone },
      create: { userId: req.userId, themeOverrides, timezone: timezone || 'UTC' },
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
