const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getGamification(req, res, next) {
  try {
    const [gami, userBadges, allBadges] = await Promise.all([
      prisma.gamification.findUnique({ where: { userId: req.userId } }),
      prisma.userBadge.findMany({
        where: { userId: req.userId },
        include: { badge: true },
      }),
      prisma.badge.findMany(),
    ]);

    const earned = new Set(userBadges.map(ub => ub.badgeId));
    const badges = allBadges.map(b => ({
      ...b,
      earned: earned.has(b.id),
      earnedAt: userBadges.find(ub => ub.badgeId === b.id)?.earnedAt || null,
    }));

    res.json({ ...gami, badges });
  } catch (err) {
    next(err);
  }
}

async function getBadges(req, res, next) {
  try {
    const [userBadges, allBadges] = await Promise.all([
      prisma.userBadge.findMany({ where: { userId: req.userId } }),
      prisma.badge.findMany(),
    ]);

    const earned = new Set(userBadges.map(ub => ub.badgeId));
    res.json(
      allBadges.map(b => ({
        ...b,
        earned: earned.has(b.id),
        earnedAt: userBadges.find(ub => ub.badgeId === b.id)?.earnedAt || null,
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { getGamification, getBadges };
