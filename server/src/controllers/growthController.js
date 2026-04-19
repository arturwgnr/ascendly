const { PrismaClient } = require('@prisma/client');
const { awardXP, checkBadges } = require('../services/xpService');

const prisma = new PrismaClient();

function toDate(str) {
  const d = new Date(str);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function getDay(req, res, next) {
  try {
    const date = toDate(req.params.date);
    const [entry, habits, logs, pillars] = await Promise.all([
      prisma.dayEntry.findUnique({ where: { userId_date: { userId: req.userId, date } } }),
      prisma.habit.findMany({ where: { userId: req.userId, isArchived: false } }),
      prisma.habitLog.findMany({ where: { userId: req.userId, date } }),
      prisma.pillar.findMany({ where: { userId: req.userId }, orderBy: { order: 'asc' } }),
    ]);

    res.json({ entry: entry || null, habits, logs, pillars });
  } catch (err) {
    next(err);
  }
}

async function upsertDay(req, res, next) {
  try {
    const date = toDate(req.params.date);
    const { dayType, noteScore, noteText, missionsDone } = req.body;

    const entry = await prisma.dayEntry.upsert({
      where: { userId_date: { userId: req.userId, date } },
      update: { dayType, noteScore, noteText, missionsDone: missionsDone || [] },
      create: {
        userId: req.userId,
        date,
        dayType: dayType || 'WORK',
        noteScore: noteScore || null,
        noteText: noteText || null,
        missionsDone: missionsDone || [],
      },
    });

    const pillars = await prisma.pillar.findMany({ where: { userId: req.userId } });
    if (missionsDone?.length === pillars.length && pillars.length > 0) {
      await awardXP(req.userId, 'ALL_MISSIONS');
    }

    await checkBadges(req.userId);
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

async function getHabits(req, res, next) {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      orderBy: { id: 'asc' },
    });
    res.json(habits);
  } catch (err) {
    next(err);
  }
}

async function createHabit(req, res, next) {
  try {
    const { label, type } = req.body;
    if (!label || !type) return res.status(400).json({ error: 'label and type required' });
    const habit = await prisma.habit.create({
      data: { userId: req.userId, label, type },
    });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
}

async function updateHabit(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.habit.findFirst({ where: { id: parseInt(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Habit not found' });

    const updated = await prisma.habit.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteHabit(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.habit.findFirst({ where: { id: parseInt(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Habit not found' });
    await prisma.habit.delete({ where: { id: parseInt(id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function toggleHabitLog(req, res, next) {
  try {
    const { id } = req.params;
    const { date, doneAt } = req.body;
    const habitId = parseInt(id);
    const logDate = toDate(date);

    const existing = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId, date: logDate } },
    });

    if (existing) {
      await prisma.habitLog.delete({ where: { habitId_date: { habitId, date: logDate } } });
      return res.json({ logged: false });
    }

    const log = await prisma.habitLog.create({
      data: { userId: req.userId, habitId, date: logDate, doneAt: doneAt ? new Date(doneAt) : null },
    });
    await awardXP(req.userId, 'HABIT_LOG');
    res.json({ logged: true, log });
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

    const entries = await prisma.dayEntry.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      select: { date: true, dayType: true, noteScore: true },
    });

    const map = {};
    for (const e of entries) {
      map[e.date.toISOString().slice(0, 10)] = {
        dayType: e.dayType,
        noteScore: e.noteScore,
      };
    }
    res.json(map);
  } catch (err) {
    next(err);
  }
}

async function getWeeklyReport(req, res, next) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await prisma.habitLog.findMany({
      where: { userId: req.userId, date: { gte: weekAgo }, doneAt: { not: null } },
      include: { habit: true },
    });

    const report = {};
    for (const log of logs) {
      const key = log.habit.type;
      if (!report[key]) report[key] = [];
      report[key].push({ label: log.habit.label, date: log.date, doneAt: log.doneAt });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
}

async function getMonthlyReport(req, res, next) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await prisma.habitLog.findMany({
      where: { userId: req.userId, date: { gte: monthStart } },
      include: { habit: { select: { label: true, type: true } } },
    });

    const byHabit = {};
    for (const log of logs) {
      const k = `${log.habitId}`;
      if (!byHabit[k]) byHabit[k] = { label: log.habit.label, type: log.habit.type, count: 0 };
      byHabit[k].count++;
    }
    res.json(Object.values(byHabit));
  } catch (err) {
    next(err);
  }
}

async function getPillars(req, res, next) {
  try {
    const pillars = await prisma.pillar.findMany({
      where: { userId: req.userId },
      orderBy: { order: 'asc' },
    });
    res.json(pillars);
  } catch (err) {
    next(err);
  }
}

async function updatePillars(req, res, next) {
  try {
    const { pillars } = req.body;
    if (!Array.isArray(pillars)) return res.status(400).json({ error: 'pillars must be an array' });

    await prisma.pillar.deleteMany({ where: { userId: req.userId } });
    const created = await prisma.pillar.createMany({
      data: pillars.map((p, i) => ({ userId: req.userId, label: p.label, order: i })),
    });
    res.json({ count: created.count });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDay,
  upsertDay,
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
  getHeatmap,
  getWeeklyReport,
  getMonthlyReport,
  getPillars,
  updatePillars,
};
