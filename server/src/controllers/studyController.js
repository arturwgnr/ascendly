const { PrismaClient } = require('@prisma/client');
const { awardXP } = require('../services/xpService');

const prisma = new PrismaClient();

async function getSessions(req, res, next) {
  try {
    const { year, month } = req.query;
    const where = { userId: req.userId };

    if (year && month) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 1);
      where.date = { gte: start, lt: end };
    }

    const sessions = await prisma.studySession.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function createSession(req, res, next) {
  try {
    const { date, topic, hours, difficulty, note } = req.body;
    if (!date || !topic || !hours || !difficulty) {
      return res.status(400).json({ error: 'date, topic, hours, difficulty required' });
    }

    const session = await prisma.studySession.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        topic,
        hours: parseFloat(hours),
        difficulty: parseInt(difficulty),
        note: note || null,
      },
    });

    await awardXP(req.userId, 'SESSION', { hours: session.hours });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.studySession.findFirst({
      where: { id: parseInt(id), userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Session not found' });

    const updated = await prisma.studySession.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.studySession.findFirst({
      where: { id: parseInt(id), userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Session not found' });

    await prisma.studySession.delete({ where: { id: parseInt(id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getHeatmap(req, res, next) {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);

    const sessions = await prisma.studySession.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      select: { date: true, hours: true },
    });

    const map = {};
    for (const s of sessions) {
      const key = s.date.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + s.hours;
    }

    res.json(map);
  } catch (err) {
    next(err);
  }
}

async function getGoal(req, res, next) {
  try {
    const now = new Date();
    const goal = await prisma.monthGoal.findUnique({
      where: {
        userId_year_month: {
          userId: req.userId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      },
    });
    res.json(goal || null);
  } catch (err) {
    next(err);
  }
}

async function upsertGoal(req, res, next) {
  try {
    const { year, month, targetHours } = req.body;
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;

    const goal = await prisma.monthGoal.upsert({
      where: { userId_year_month: { userId: req.userId, year: y, month: m } },
      update: { targetHours: parseFloat(targetHours) },
      create: { userId: req.userId, year: y, month: m, targetHours: parseFloat(targetHours) },
    });
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [weekSessions, monthSessions, goal] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: req.userId, date: { gte: weekAgo } },
        select: { hours: true },
      }),
      prisma.studySession.findMany({
        where: { userId: req.userId, date: { gte: monthStart } },
        select: { hours: true },
      }),
      prisma.monthGoal.findUnique({
        where: {
          userId_year_month: {
            userId: req.userId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      }),
    ]);

    const weeklyTotal = weekSessions.reduce((s, r) => s + r.hours, 0);
    const monthlyTotal = monthSessions.reduce((s, r) => s + r.hours, 0);

    res.json({
      weeklyTotal: Math.round(weeklyTotal * 10) / 10,
      weeklyAvg: Math.round((weeklyTotal / 7) * 10) / 10,
      monthlyTotal: Math.round(monthlyTotal * 10) / 10,
      goalProgress: goal
        ? Math.round((monthlyTotal / goal.targetHours) * 1000) / 10
        : null,
      goal: goal || null,
    });
  } catch (err) {
    next(err);
  }
}

async function getSnapshots(req, res, next) {
  try {
    const snapshots = await prisma.monthSnapshot.findMany({
      where: { userId: req.userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(snapshots);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getHeatmap,
  getGoal,
  upsertGoal,
  getMetrics,
  getSnapshots,
};
