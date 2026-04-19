require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { clientOrigin, port } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { startMonthResetCron } = require('./services/monthReset');

const app = express();

app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/study',         require('./routes/study'));
app.use('/api/growth',        require('./routes/growth'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/gamification',  require('./routes/gamification'));
app.use('/api/settings',      require('./routes/settings'));
app.use('/api/dashboard',     require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use(errorHandler);

startMonthResetCron();

app.listen(port, () => {
  console.log(`Ascendly server running on port ${port}`);
});
