const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getSummary } = require('../controllers/dashboardController');

router.use(requireAuth);
router.get('/summary', getSummary);

module.exports = router;
