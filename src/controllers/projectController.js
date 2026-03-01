import { randomUUID } from 'crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag)).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((tag) => String(tag)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeResources(value) {
  if (Array.isArray(value)) {
    return value.map((resource) => String(resource)).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((resource) => String(resource)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function mapProject(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    tags: normalizeTags(row.tags),
    notes: row.notes,
    resources: normalizeResources(row.resources),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
export const listProjects = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, description, status, priority, tags, notes, resources, created_at, updated_at
     FROM projects
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [req.user.id]
  );

  res.status(200).json(rows.map(mapProject));
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req, res) => {
  const { title, description, status, priority, tags, notes, resources } = req.body;

  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required');
  }

  const id = randomUUID();
  const normalizedTags = normalizeTags(tags);
  const normalizedResources = normalizeResources(resources);

  await pool.query(
    `INSERT INTO projects (id, user_id, title, description, status, priority, tags, notes, resources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.user.id,
      title.trim(),
      description.trim(),
      status || 'Idea',
      priority || 'Medium',
      JSON.stringify(normalizedTags),
      notes || '',
      JSON.stringify(normalizedResources)
    ]
  );

  const [rows] = await pool.query(
    `SELECT id, title, description, status, priority, tags, notes, resources, created_at, updated_at
     FROM projects
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  res.status(201).json(mapProject(rows[0]));
});

// @desc    Update project
// @route   PUT /api/projects/:projectId
// @access  Private
export const updateProject = asyncHandler(async (req, res) => {
  const { title, description, status, priority, tags, notes, resources } = req.body;
  const normalizedTags = normalizeTags(tags);
  const normalizedResources = normalizeResources(resources);

  const [result] = await pool.query(
    `UPDATE projects 
     SET title = ?, description = ?, status = ?, priority = ?, 
         tags = ?, notes = ?, resources = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [
      title.trim(),
      description.trim(),
      status,
      priority,
      JSON.stringify(normalizedTags),
      notes || '',
      JSON.stringify(normalizedResources),
      req.params.projectId,
      req.user.id
    ]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Project not found');
  }

  const [rows] = await pool.query(
    `SELECT id, title, description, status, priority, tags, notes, resources, created_at, updated_at
     FROM projects
     WHERE id = ?
     LIMIT 1`,
    [req.params.projectId]
  );

  res.status(200).json(mapProject(rows[0]));
});

// @desc    Delete project
// @route   DELETE /api/projects/:projectId
// @access  Private
export const deleteProject = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [req.params.projectId, req.user.id]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Project not found');
  }

  res.status(200).json({ message: 'Project deleted successfully' });
});
