const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM resume_configs ORDER BY updated_at DESC').all());
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM resume_configs WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Resume config not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { name, config_json } = req.body;
    const result = db.prepare(
      'INSERT INTO resume_configs (name, config_json) VALUES (?,?)'
    ).run(name, typeof config_json === 'string' ? config_json : JSON.stringify(config_json));
    res.status(201).json(db.prepare('SELECT * FROM resume_configs WHERE id=?').get(result.lastInsertRowid));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { name, config_json } = req.body;
    db.prepare(`
      UPDATE resume_configs SET name=?, config_json=?, updated_at=datetime('now')
      WHERE id=?
    `).run(name, typeof config_json === 'string' ? config_json : JSON.stringify(config_json), req.params.id);
    const row = db.prepare('SELECT * FROM resume_configs WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Resume config not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM resume_configs WHERE id=?').run(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
