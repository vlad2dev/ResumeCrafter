const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) { next(err); }
});

router.put('/', (req, res, next) => {
  try {
    const db = getDb();
    const { full_name, email, phone, location, linkedin, github, website, summary } = req.body;
    db.prepare(`
      UPDATE profile SET
        full_name=?, email=?, phone=?, location=?,
        linkedin=?, github=?, website=?, summary=?,
        updated_at=datetime('now')
      WHERE id=1
    `).run(
      full_name ?? '', email ?? '', phone ?? '', location ?? '',
      linkedin ?? '', github ?? '', website ?? '', summary ?? ''
    );
    const updated = db.prepare('SELECT * FROM profile WHERE id=1').get();
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
