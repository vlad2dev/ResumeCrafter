const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/jobs
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const jobs = db.prepare('SELECT * FROM jobs ORDER BY sort_order, start_date DESC').all();
    const getResps = db.prepare(
      'SELECT * FROM job_responsibilities WHERE job_id=? ORDER BY sort_order'
    );
    jobs.forEach(j => { j.responsibilities = getResps.all(j.id); });
    res.json(jobs);
  } catch (err) { next(err); }
});

// GET /api/jobs/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    job.responsibilities = db.prepare(
      'SELECT * FROM job_responsibilities WHERE job_id=? ORDER BY sort_order'
    ).all(job.id);
    res.json(job);
  } catch (err) { next(err); }
});

// POST /api/jobs
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { title, company, location, start_date, end_date, is_current, description } = req.body;
    const result = db.prepare(`
      INSERT INTO jobs (title, company, location, start_date, end_date, is_current, description)
      VALUES (?,?,?,?,?,?,?)
    `).run(
      title, company, location ?? '', start_date,
      is_current ? null : (end_date ?? null),
      is_current ? 1 : 0, description ?? ''
    );
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(result.lastInsertRowid);
    job.responsibilities = [];
    res.status(201).json(job);
  } catch (err) { next(err); }
});

// PUT /api/jobs/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { title, company, location, start_date, end_date, is_current, description } = req.body;
    db.prepare(`
      UPDATE jobs SET title=?, company=?, location=?, start_date=?,
        end_date=?, is_current=?, description=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      title, company, location ?? '', start_date,
      is_current ? null : (end_date ?? null),
      is_current ? 1 : 0, description ?? '', req.params.id
    );
    const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    job.responsibilities = db.prepare(
      'SELECT * FROM job_responsibilities WHERE job_id=? ORDER BY sort_order'
    ).all(job.id);
    res.json(job);
  } catch (err) { next(err); }
});

// DELETE /api/jobs/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /api/jobs/:id/responsibilities
router.get('/:id/responsibilities', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM job_responsibilities WHERE job_id=? ORDER BY sort_order'
    ).all(req.params.id);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/jobs/:id/responsibilities
router.post('/:id/responsibilities', (req, res, next) => {
  try {
    const db = getDb();
    const { bullet_text, sort_order } = req.body;
    const result = db.prepare(
      'INSERT INTO job_responsibilities (job_id, bullet_text, sort_order) VALUES (?,?,?)'
    ).run(req.params.id, bullet_text, sort_order ?? 0);
    const row = db.prepare('SELECT * FROM job_responsibilities WHERE id=?')
                  .get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/jobs/:jobId/responsibilities/:respId
router.put('/:jobId/responsibilities/:respId', (req, res, next) => {
  try {
    const db = getDb();
    const { bullet_text, sort_order } = req.body;
    db.prepare(
      'UPDATE job_responsibilities SET bullet_text=?, sort_order=? WHERE id=? AND job_id=?'
    ).run(bullet_text, sort_order ?? 0, req.params.respId, req.params.jobId);
    const row = db.prepare('SELECT * FROM job_responsibilities WHERE id=?')
                  .get(req.params.respId);
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/jobs/:jobId/responsibilities/:respId
router.delete('/:jobId/responsibilities/:respId', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare(
      'DELETE FROM job_responsibilities WHERE id=? AND job_id=?'
    ).run(req.params.respId, req.params.jobId);
    res.status(204).end();
  } catch (err) { next(err); }
});

// PUT /api/jobs/:id/responsibilities  (bulk reorder)
router.put('/:id/responsibilities', (req, res, next) => {
  try {
    const db = getDb();
    const { responsibilities } = req.body;
    const updateStmt = db.prepare(
      'UPDATE job_responsibilities SET bullet_text=?, sort_order=? WHERE id=? AND job_id=?'
    );
    db.exec('BEGIN');
    try {
      responsibilities.forEach(r => updateStmt.run(r.bullet_text, r.sort_order, r.id, req.params.id));
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    const rows = db.prepare(
      'SELECT * FROM job_responsibilities WHERE job_id=? ORDER BY sort_order'
    ).all(req.params.id);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
