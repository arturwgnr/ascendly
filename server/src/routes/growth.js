const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/growthController');

router.use(requireAuth);

router.get('/day/:date', c.getDay);
router.put('/day/:date', c.upsertDay);
router.get('/habits', c.getHabits);
router.post('/habits', c.createHabit);
router.put('/habits/:id', c.updateHabit);
router.delete('/habits/:id', c.deleteHabit);
router.post('/habits/:id/log', c.toggleHabitLog);
router.get('/heatmap', c.getHeatmap);
router.get('/report/weekly', c.getWeeklyReport);
router.get('/report/monthly', c.getMonthlyReport);
router.get('/pillars', c.getPillars);
router.put('/pillars', c.updatePillars);

module.exports = router;
