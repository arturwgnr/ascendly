const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/tasksController');

router.use(requireAuth);

router.get('/', c.getTasks);
router.post('/', c.createTask);
router.put('/:id', c.updateTask);
router.delete('/:id', c.deleteTask);
router.get('/board', c.getBoard);
router.post('/allocate', c.allocateTask);
router.delete('/allocate/:id', c.removeAllocation);

module.exports = router;
