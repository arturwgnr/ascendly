const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const XP_TABLE = {
  SESSION: (data) => Math.round((data?.hours || 1) * 20),
  HABIT_LOG: () => 5,
  TASK_DONE: () => 15,
  ALL_MISSIONS: () => 30,
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2750, 3750, 5000];

function calcLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

async function awardXP(userId, event, data = {}) {
  const earn = XP_TABLE[event];
  if (!earn) return;

  const amount = earn(data);
  const gami = await prisma.gamification.upsert({
    where: { userId },
    update: { xp: { increment: amount } },
    create: { userId, xp: amount, level: 1, streak: 0 },
  });

  const newLevel = calcLevel(gami.xp + amount);
  if (newLevel !== gami.level) {
    await prisma.gamification.update({ where: { userId }, data: { level: newLevel } });
  }
}

const BADGE_RULES = [
  {
    key: 'FIRST_SESSION',
    check: async (userId) => {
      const count = await prisma.studySession.count({ where: { userId } });
      return count >= 1;
    },
  },
  {
    key: 'STUDY_10H',
    check: async (userId) => {
      const sessions = await prisma.studySession.findMany({
        where: { userId },
        select: { hours: true },
      });
      return sessions.reduce((s, r) => s + r.hours, 0) >= 10;
    },
  },
  {
    key: 'STUDY_50H',
    check: async (userId) => {
      const sessions = await prisma.studySession.findMany({
        where: { userId },
        select: { hours: true },
      });
      return sessions.reduce((s, r) => s + r.hours, 0) >= 50;
    },
  },
  {
    key: 'STUDY_100H',
    check: async (userId) => {
      const sessions = await prisma.studySession.findMany({
        where: { userId },
        select: { hours: true },
      });
      return sessions.reduce((s, r) => s + r.hours, 0) >= 100;
    },
  },
  {
    key: 'STREAK_7',
    check: async (userId) => {
      const g = await prisma.gamification.findUnique({ where: { userId } });
      return g?.streak >= 7;
    },
  },
  {
    key: 'STREAK_30',
    check: async (userId) => {
      const g = await prisma.gamification.findUnique({ where: { userId } });
      return g?.streak >= 30;
    },
  },
  {
    key: 'STREAK_100',
    check: async (userId) => {
      const g = await prisma.gamification.findUnique({ where: { userId } });
      return g?.streak >= 100;
    },
  },
  {
    key: 'TASKS_DONE_25',
    check: async (userId) => {
      const count = await prisma.task.count({ where: { userId, status: 'DONE' } });
      return count >= 25;
    },
  },
  {
    key: 'ALL_MISSIONS',
    check: async (userId) => {
      const entries = await prisma.dayEntry.findMany({
        where: { userId },
        select: { missionsDone: true },
      });
      const pillars = await prisma.pillar.findMany({ where: { userId } });
      return entries.some(e => e.missionsDone.length >= pillars.length && pillars.length > 0);
    },
  },
];

async function checkBadges(userId) {
  const [existingBadges, allBadges] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId }, select: { badge: { select: { key: true } } } }),
    prisma.badge.findMany(),
  ]);

  const earned = new Set(existingBadges.map(ub => ub.badge.key));
  const badgeMap = Object.fromEntries(allBadges.map(b => [b.key, b]));

  for (const rule of BADGE_RULES) {
    if (earned.has(rule.key)) continue;
    const qualifies = await rule.check(userId);
    if (qualifies) {
      const badge = badgeMap[rule.key];
      if (!badge) continue;
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      if (badge.xpReward > 0) {
        await prisma.gamification.update({
          where: { userId },
          data: { xp: { increment: badge.xpReward } },
        });
      }
    }
  }
}

async function updateStreak(userId) {
  const gami = await prisma.gamification.findUnique({ where: { userId } });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (!gami) return;

  const lastActive = gami.lastActiveDate ? new Date(gami.lastActiveDate) : null;
  let newStreak = gami.streak;

  if (!lastActive) {
    newStreak = 1;
  } else {
    const diff = Math.round((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diff === 1) newStreak += 1;
    else if (diff > 1) newStreak = 1;
  }

  await prisma.gamification.update({
    where: { userId },
    data: { streak: newStreak, lastActiveDate: today },
  });

  await checkBadges(userId);
}

module.exports = { awardXP, checkBadges, updateStreak };
