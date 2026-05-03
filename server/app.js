const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const profileRouter      = require('./routes/profile');
const jobsRouter         = require('./routes/jobs');
const skillsRouter       = require('./routes/skills');
const certsRouter        = require('./routes/certifications');
const awardsRouter       = require('./routes/awards');
const aiRouter           = require('./routes/ai');
const settingsRouter     = require('./routes/settings');
const resumesRouter      = require('./routes/resumes');
const errorHandler       = require('./middleware/errorHandler');

const app = express();

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}vendor${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.use('/api/profile',          profileRouter);
app.use('/api/jobs',             jobsRouter);
app.use('/api/skill-categories', skillsRouter);
app.use('/api/skills',           skillsRouter);
app.use('/api/certifications',   certsRouter);
app.use('/api/awards',           awardsRouter);
app.use('/api/ai',               aiRouter);
app.use('/api/settings',         settingsRouter);
app.use('/api/resumes',          resumesRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

module.exports = app;
