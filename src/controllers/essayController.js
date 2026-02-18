import { randomUUID } from 'crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { countWords } from '../utils/text.js';

function mapEssay(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    wordCount: row.word_count,
    aiSuggestions: row.ai_suggestions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listEssays = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [req.user.id],
  );

  res.status(200).json(rows.map(mapEssay));
});

export const getEssayById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [req.params.essayId, req.user.id],
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Essay not found');
  }

  res.status(200).json(mapEssay(rows[0]));
});

export const createEssay = asyncHandler(async (req, res) => {
  const { title, content, status } = req.body;
  const id = randomUUID();
  const wordCount = countWords(content);

  await pool.query(
    `INSERT INTO essays (id, user_id, title, content, status, word_count, ai_suggestions)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [id, req.user.id, title.trim(), content, status, wordCount],
  );

  const [rows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  res.status(201).json(mapEssay(rows[0]));
});

export const updateEssay = asyncHandler(async (req, res) => {
  const { title, content, status } = req.body;
  const wordCount = countWords(content);

  const [result] = await pool.query(
    `UPDATE essays
     SET title = ?, content = ?, status = ?, word_count = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [title.trim(), content, status, wordCount, req.params.essayId, req.user.id],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Essay not found');
  }

  const [rows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE id = ?
     LIMIT 1`,
    [req.params.essayId],
  );

  res.status(200).json(mapEssay(rows[0]));
});

export const deleteEssay = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM essays WHERE id = ? AND user_id = ?', [
    req.params.essayId,
    req.user.id,
  ]);

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Essay not found');
  }

  res.status(200).json({ message: 'Essay deleted' });
});

export const improveEssay = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, content FROM essays WHERE id = ? AND user_id = ? LIMIT 1',
    [req.params.essayId, req.user.id],
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Essay not found');
  }

  const suggestionText =
    '\n\nAI Suggestion: Consider varying sentence openings with transition phrases to improve flow.';
  const nextContent = `${rows[0].content}${suggestionText}`.trim();
  const wordCount = countWords(nextContent);

  await pool.query(
    `UPDATE essays
     SET content = ?, status = 'In Review', word_count = ?, ai_suggestions = ai_suggestions + 1, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [nextContent, wordCount, req.params.essayId, req.user.id],
  );

  const [updatedRows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE id = ?
     LIMIT 1`,
    [req.params.essayId],
  );

  res.status(200).json(mapEssay(updatedRows[0]));
});
