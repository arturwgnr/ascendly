const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSummary(req, res, next) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    const [
      dayEntry,
      pillars,
      todayHabits,
      todayLogs,
      weekSessions,
      todayTasks,
      gami,
    ] = await Promise.all([
      prisma.dayEntry.findUnique({
        where: { userId_date: { userId: req.userId, date: today } },
      }),
      prisma.pillar.findMany({ where: { userId: req.userId }, orderBy: { order: 'asc' } }),
      prisma.habit.findMany({ where: { userId: req.userId, isArchived: false } }),
      prisma.habitLog.findMany({ where: { userId: req.userId, date: today } }),
      prisma.studySession.findMany({
        where: { userId: req.userId, date: { gte: weekStart } },
        select: { hours: true },
      }),
      prisma.taskAllocation.findMany({
        where: {
          userId: req.userId,
          weekStart: weekStart,
          dayOfWeek: today.getDay() === 0 ? 6 : today.getDay() - 1,
        },
        include: { task: true },
      }),
      prisma.gamification.findUnique({ where: { userId: req.userId } }),
    ]);

    const weeklyStudyHours = weekSessions.reduce((s, r) => s + r.hours, 0);
    const loggedHabitIds = new Set(todayLogs.map(l => l.habitId));

    res.json({
      today: {
        date: today,
        entry: dayEntry,
        pillars,
        habitsCompleted: todayLogs.length,
        habitTotal: todayHabits.length,
        habits: todayHabits.map(h => ({ ...h, logged: loggedHabitIds.has(h.id) })),
      },
      study: {
        weeklyTotal: Math.round(weeklyStudyHours * 10) / 10,
      },
      tasks: todayTasks.map(a => a.task),
      gamification: gami,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
