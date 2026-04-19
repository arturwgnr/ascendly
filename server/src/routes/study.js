const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/studyController');

router.use(requireAuth);

router.get('/sessions', c.getSessions);
router.post('/sessions', c.createSession);
router.put('/sessions/:id', c.updateSession);
router.delete('/sessions/:id', c.deleteSession);
router.get('/heatmap', c.getHeatmap);
router.get('/goal', c.getGoal);
router.post('/goal', c.upsertGoal);
router.get('/metrics', c.getMetrics);
router.get('/snapshots', c.getSnapshots);

module.exports = router;
