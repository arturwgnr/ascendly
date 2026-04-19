const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getGamification, getBadges } = require('../controllers/gamificationController');

router.use(requireAuth);
router.get('/', getGamification);
router.get('/badges', getBadges);

module.exports = router;
