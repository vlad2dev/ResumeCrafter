const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM awards ORDER BY date DESC').all());
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM awards WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Award not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { title, issuer, date, description } = req.body;
    const result = db.prepare(
      'INSERT INTO awards (title, issuer, date, description) VALUES (?,?,?,?)'
    ).run(title, issuer ?? '', date ?? null, description ?? '');
    res.status(201).json(db.prepare('SELECT * FROM awards WHERE id=?').get(result.lastInsertRowid));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { title, issuer, date, description } = req.body;
    db.prepare(`
      UPDATE awards SET title=?, issuer=?, date=?, description=?, updated_at=datetime('now')
      WHERE id=?
    `).run(title, issuer ?? '', date ?? null, description ?? '', req.params.id);
    const row = db.prepare('SELECT * FROM awards WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Award not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM awards WHERE id=?').run(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
