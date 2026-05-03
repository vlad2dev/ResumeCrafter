const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    rows.forEach(r => {
      // Mask API key — show only last 4 chars
      if (r.key === 'gemini_api_key' && r.value.length > 4) {
        result[r.key] = '•'.repeat(r.value.length - 4) + r.value.slice(-4);
      } else {
        result[r.key] = r.value;
      }
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?,?,datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
    `);
    const filtered = { ...req.body };
    // Don't overwrite the real key if user submits a masked placeholder
    if (filtered.gemini_api_key && /^•+/.test(filtered.gemini_api_key)) {
      delete filtered.gemini_api_key;
    }
    db.exec('BEGIN');
    try {
      Object.entries(filtered).forEach(([k, v]) => upsert.run(k, String(v)));
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    res.json({ saved: true });
  } catch (err) { next(err); }
});

module.exports = router;
