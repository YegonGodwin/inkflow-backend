import { randomUUID } from 'crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function mapConcept(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    definition: row.definition,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listConcepts = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, category, definition, tags, created_at, updated_at
     FROM concepts
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [req.user.id],
  );

  res.status(200).json(rows.map(mapConcept));
});

export const getConceptById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, category, definition, tags, created_at, updated_at
     FROM concepts
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [req.params.conceptId, req.user.id],
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Concept not found');
  }

  res.status(200).json(mapConcept(rows[0]));
});

export const createConcept = asyncHandler(async (req, res) => {
  const { title, category, definition, tags } = req.body;
  const id = randomUUID();

  await pool.query(
    `INSERT INTO concepts (id, user_id, title, category, definition, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, title.trim(), category, definition, JSON.stringify(tags || [])],
  );

  const [rows] = await pool.query(
    `SELECT id, title, category, definition, tags, created_at, updated_at
     FROM concepts
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  res.status(201).json(mapConcept(rows[0]));
});

export const updateConcept = asyncHandler(async (req, res) => {
  const { title, category, definition, tags } = req.body;

  const [result] = await pool.query(
    `UPDATE concepts
     SET title = ?, category = ?, definition = ?, tags = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [title.trim(), category, definition, JSON.stringify(tags || []), req.params.conceptId, req.user.id],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Concept not found');
  }

  const [rows] = await pool.query(
    `SELECT id, title, category, definition, tags, created_at, updated_at
     FROM concepts
     WHERE id = ?
     LIMIT 1`,
    [req.params.conceptId],
  );

  res.status(200).json(mapConcept(rows[0]));
});

export const deleteConcept = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM concepts WHERE id = ? AND user_id = ?', [
    req.params.conceptId,
    req.user.id,
  ]);

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Concept not found');
  }

  res.status(200).json({ message: 'Concept deleted' });
});
