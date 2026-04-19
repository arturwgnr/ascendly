const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.use(requireAuth);
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
