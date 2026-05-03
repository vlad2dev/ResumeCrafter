const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// ── Skill Categories ──────────────────────────────────────────────────────

// GET /api/skill-categories
router.get('/categories', (req, res, next) => {
  try {
    const db = getDb();
    const cats = db.prepare('SELECT * FROM skill_categories ORDER BY sort_order, name').all();
    res.json(cats);
  } catch (err) { next(err); }
});

// POST /api/skill-categories
router.post('/categories', (req, res, next) => {
  try {
    const db = getDb();
    const { name, sort_order } = req.body;
    const result = db.prepare(
      'INSERT INTO skill_categories (name, sort_order) VALUES (?,?)'
    ).run(name, sort_order ?? 0);
    const row = db.prepare('SELECT * FROM skill_categories WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/skill-categories/:id
router.put('/categories/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { name, sort_order } = req.body;
    db.prepare('UPDATE skill_categories SET name=?, sort_order=? WHERE id=?')
      .run(name, sort_order ?? 0, req.params.id);
    const row = db.prepare('SELECT * FROM skill_categories WHERE id=?').get(req.params.id);
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/skill-categories/:id
router.delete('/categories/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM skill_categories WHERE id=?').run(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Skills ────────────────────────────────────────────────────────────────

// GET /api/skills
router.get('/', (req, res, next) => {
  try {
    const db = getDb();

    // When mounted at /api/skill-categories, return categories
    if (req.baseUrl.includes('skill-categories')) {
      const cats = db.prepare('SELECT * FROM skill_categories ORDER BY sort_order, name').all();
      return res.json(cats);
    }

    const skills = db.prepare(`
      SELECT s.*, sc.name AS category_name
      FROM skills s
      LEFT JOIN skill_categories sc ON s.category_id = sc.id
      ORDER BY sc.sort_order, s.sort_order, s.name
    `).all();
    res.json(skills);
  } catch (err) { next(err); }
});

// GET /api/skills/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    if (req.baseUrl.includes('skill-categories')) {
      const cat = db.prepare('SELECT * FROM skill_categories WHERE id=?').get(req.params.id);
      if (!cat) return res.status(404).json({ error: 'Category not found' });
      return res.json(cat);
    }
    const skill = db.prepare('SELECT * FROM skills WHERE id=?').get(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (err) { next(err); }
});

// POST /api/skills
router.post('/', (req, res, next) => {
  try {
    const db = getDb();

    if (req.baseUrl.includes('skill-categories')) {
      const { name, sort_order } = req.body;
      const result = db.prepare(
        'INSERT INTO skill_categories (name, sort_order) VALUES (?,?)'
      ).run(name, sort_order ?? 0);
      const row = db.prepare('SELECT * FROM skill_categories WHERE id=?').get(result.lastInsertRowid);
      return res.status(201).json(row);
    }

    const { category_id, name, proficiency, sort_order } = req.body;
    const result = db.prepare(
      'INSERT INTO skills (category_id, name, proficiency, sort_order) VALUES (?,?,?,?)'
    ).run(category_id ?? null, name, proficiency ?? 'intermediate', sort_order ?? 0);
    const skill = db.prepare('SELECT * FROM skills WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json(skill);
  } catch (err) { next(err); }
});

// PUT /api/skills/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();

    if (req.baseUrl.includes('skill-categories')) {
      const { name, sort_order } = req.body;
      db.prepare('UPDATE skill_categories SET name=?, sort_order=? WHERE id=?')
        .run(name, sort_order ?? 0, req.params.id);
      const row = db.prepare('SELECT * FROM skill_categories WHERE id=?').get(req.params.id);
      return res.json(row);
    }

    const { category_id, name, proficiency, sort_order } = req.body;
    db.prepare(
      'UPDATE skills SET category_id=?, name=?, proficiency=?, sort_order=? WHERE id=?'
    ).run(category_id ?? null, name, proficiency ?? 'intermediate', sort_order ?? 0, req.params.id);
    const skill = db.prepare('SELECT * FROM skills WHERE id=?').get(req.params.id);
    res.json(skill);
  } catch (err) { next(err); }
});

// DELETE /api/skills/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    if (req.baseUrl.includes('skill-categories')) {
      db.prepare('DELETE FROM skill_categories WHERE id=?').run(req.params.id);
    } else {
      db.prepare('DELETE FROM skills WHERE id=?').run(req.params.id);
    }
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
