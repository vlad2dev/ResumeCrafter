const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM certifications ORDER BY issue_date DESC').all());
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM certifications WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Certification not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { name, issuer, issue_date, expiry_date, credential_id, credential_url } = req.body;
    const result = db.prepare(`
      INSERT INTO certifications (name, issuer, issue_date, expiry_date, credential_id, credential_url)
      VALUES (?,?,?,?,?,?)
    `).run(name, issuer ?? '', issue_date ?? null, expiry_date ?? null,
           credential_id ?? '', credential_url ?? '');
    res.status(201).json(db.prepare('SELECT * FROM certifications WHERE id=?').get(result.lastInsertRowid));
  } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { name, issuer, issue_date, expiry_date, credential_id, credential_url } = req.body;
    db.prepare(`
      UPDATE certifications SET name=?, issuer=?, issue_date=?, expiry_date=?,
        credential_id=?, credential_url=?, updated_at=datetime('now')
      WHERE id=?
    `).run(name, issuer ?? '', issue_date ?? null, expiry_date ?? null,
           credential_id ?? '', credential_url ?? '', req.params.id);
    const row = db.prepare('SELECT * FROM certifications WHERE id=?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Certification not found' });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM certifications WHERE id=?').run(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
