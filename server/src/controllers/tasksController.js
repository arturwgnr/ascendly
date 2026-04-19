const { PrismaClient } = require('@prisma/client');
const { awardXP, checkBadges } = require('../services/xpService');

const prisma = new PrismaClient();

async function getTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { allocations: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const task = await prisma.task.create({
      data: {
        userId: req.userId,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
      },
      include: { allocations: true },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id: parseInt(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const wasNotDone = existing.status !== 'DONE';
    const updated = await prisma.task.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: { allocations: true },
    });

    if (wasNotDone && updated.status === 'DONE') {
      await awardXP(req.userId, 'TASK_DONE');
      await checkBadges(req.userId);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id: parseInt(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    await prisma.task.delete({ where: { id: parseInt(id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getBoard(req, res, next) {
  try {
    const { weekStart } = req.query;
    if (!weekStart) return res.status(400).json({ error: 'weekStart required' });

    const ws = new Date(weekStart);
    ws.setUTCHours(0, 0, 0, 0);

    const allocations = await prisma.taskAllocation.findMany({
      where: { userId: req.userId, weekStart: ws },
      include: { task: true },
    });

    const board = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const a of allocations) {
      board[a.dayOfWeek].push({ allocationId: a.id, ...a.task });
    }

    res.json(board);
  } catch (err) {
    next(err);
  }
}

async function allocateTask(req, res, next) {
  try {
    const { taskId, weekStart, dayOfWeek } = req.body;
    if (taskId == null || !weekStart || dayOfWeek == null) {
      return res.status(400).json({ error: 'taskId, weekStart, dayOfWeek required' });
    }

    const task = await prisma.task.findFirst({ where: { id: parseInt(taskId), userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const ws = new Date(weekStart);
    ws.setUTCHours(0, 0, 0, 0);

    const allocation = await prisma.taskAllocation.upsert({
      where: { taskId_weekStart: { taskId: parseInt(taskId), weekStart: ws } },
      update: { dayOfWeek: parseInt(dayOfWeek) },
      create: {
        taskId: parseInt(taskId),
        userId: req.userId,
        weekStart: ws,
        dayOfWeek: parseInt(dayOfWeek),
      },
    });

    res.json(allocation);
  } catch (err) {
    next(err);
  }
}

async function removeAllocation(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.taskAllocation.findFirst({
      where: { id: parseInt(id), userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Allocation not found' });
    await prisma.taskAllocation.delete({ where: { id: parseInt(id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getBoard,
  allocateTask,
  removeAllocation,
};
