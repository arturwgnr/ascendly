-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WORK', 'OFF');

-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('GOOD', 'BAD');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "topic" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthGoal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "targetHours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MonthGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthSnapshot" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "avgPerDay" DOUBLE PRECISION NOT NULL,
    "topTopics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pillar" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "dayType" "DayType" NOT NULL DEFAULT 'WORK',
    "noteScore" INTEGER,
    "noteText" TEXT,
    "missionsDone" INTEGER[],

    CONSTRAINT "DayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "HabitType" NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "habitId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAllocation" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,

    CONSTRAINT "TaskAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gamification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),

    CONSTRAINT "Gamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "themeOverrides" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "MonthGoal_userId_year_month_key" ON "MonthGoal"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthSnapshot_userId_year_month_key" ON "MonthSnapshot"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_userId_date_key" ON "DayEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HabitLog_habitId_date_key" ON "HabitLog"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAllocation_taskId_weekStart_key" ON "TaskAllocation"("taskId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Gamification_userId_key" ON "Gamification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthGoal" ADD CONSTRAINT "MonthGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthSnapshot" ADD CONSTRAINT "MonthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pillar" ADD CONSTRAINT "Pillar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayEntry" ADD CONSTRAINT "DayEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAllocation" ADD CONSTRAINT "TaskAllocation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAllocation" ADD CONSTRAINT "TaskAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gamification" ADD CONSTRAINT "Gamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
