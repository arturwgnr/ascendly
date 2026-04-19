const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BADGES = [
  { key: 'FIRST_SESSION',  label: 'First Step',      icon: '🌱', xpReward: 50  },
  { key: 'STUDY_10H',      label: '10 Hours In',     icon: '📚', xpReward: 100 },
  { key: 'STUDY_50H',      label: 'Scholar',         icon: '🎓', xpReward: 250 },
  { key: 'STUDY_100H',     label: 'Century',         icon: '💯', xpReward: 500 },
  { key: 'STREAK_7',       label: 'Week Streak',     icon: '🔥', xpReward: 150 },
  { key: 'STREAK_30',      label: 'Month Streak',    icon: '⚡', xpReward: 500 },
  { key: 'STREAK_100',     label: 'Centurion',       icon: '🏆', xpReward: 1000 },
  { key: 'HABITS_GOOD_10', label: 'Good Habits',     icon: '✅', xpReward: 100 },
  { key: 'TASKS_DONE_25',  label: 'Task Master',     icon: '📋', xpReward: 200 },
  { key: 'ALL_MISSIONS',   label: 'Perfect Day',     icon: '⭐', xpReward: 75  },
];

async function main() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
  }
  console.log('Seeded badges.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
