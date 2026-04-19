const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMonthlyReset() {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const monthStart = new Date(prevYear, prevMonth - 1, 1);
  const monthEnd = new Date(prevYear, prevMonth, 1);

  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id, date: { gte: monthStart, lt: monthEnd } },
      select: { hours: true, topic: true, date: true },
    });

    if (sessions.length === 0) continue;

    const totalHours = sessions.reduce((s, r) => s + r.hours, 0);
    const daysActive = new Set(sessions.map(s => s.date.toISOString().slice(0, 10))).size;
    const avgPerDay = daysActive > 0 ? totalHours / daysActive : 0;

    const topicMap = {};
    for (const s of sessions) {
      topicMap[s.topic] = (topicMap[s.topic] || 0) + s.hours;
    }
    const topTopics = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, hours]) => ({ topic, hours: Math.round(hours * 10) / 10 }));

    await prisma.monthSnapshot.upsert({
      where: { userId_year_month: { userId: user.id, year: prevYear, month: prevMonth } },
      update: {},
      create: {
        userId: user.id,
        year: prevYear,
        month: prevMonth,
        totalHours: Math.round(totalHours * 10) / 10,
        avgPerDay: Math.round(avgPerDay * 10) / 10,
        topTopics,
      },
    });
  }

  console.log(`[monthReset] Snapshots saved for ${users.length} users.`);
}

function startMonthResetCron() {
  // Run at 00:05 on the 1st of every month
  cron.schedule('5 0 1 * *', async () => {
    console.log('[monthReset] Starting monthly reset...');
    try {
      await runMonthlyReset();
    } catch (err) {
      console.error('[monthReset] Error:', err);
    }
  });
  console.log('[monthReset] Cron scheduled.');
}

module.exports = { startMonthResetCron, runMonthlyReset };
