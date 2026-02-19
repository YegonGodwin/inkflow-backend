import { randomUUID } from 'crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { countWords } from '../utils/text.js';
import {
  generateBriefFromInsights,
  generateOutlineFromBrief,
} from '../services/technologyAiService.js';

function parseJson(value, fallback = []) {
  try {
    if (!value) {
      return fallback;
    }
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapTopic(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    followed: Boolean(row.followed),
    priority: row.priority || null,
    followedAt: row.followed_at || null,
  };
}

function mapInsight(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    title: row.title,
    content: row.content,
    sourceUrl: row.source_url,
    tags: parseJson(row.tags, []),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBrief(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    summary: row.summary,
    keyPoints: parseJson(row.key_points, []),
    opportunities: parseJson(row.opportunities, []),
    risks: parseJson(row.risks, []),
    sourceInsightIds: parseJson(row.source_insight_ids, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOutline(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    briefId: row.brief_id,
    title: row.title,
    thesis: row.thesis,
    sections: parseJson(row.sections, []),
    tone: row.tone,
    targetLength: row.target_length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getTopicById(topicId) {
  const [rows] = await pool.query(
    'SELECT id, name, slug, description FROM technology_topics WHERE id = ? AND is_active = 1 LIMIT 1',
    [topicId],
  );
  return rows[0] || null;
}

export const listTopics = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.name,
      t.slug,
      t.description,
      CASE WHEN utt.id IS NULL THEN 0 ELSE 1 END AS followed,
      utt.priority,
      utt.created_at AS followed_at
     FROM technology_topics t
     LEFT JOIN user_technology_topics utt
       ON utt.topic_id = t.id AND utt.user_id = ?
     WHERE t.is_active = 1
     ORDER BY t.name ASC`,
    [req.user.id],
  );

  res.status(200).json(rows.map(mapTopic));
});

export const followTopic = asyncHandler(async (req, res) => {
  const topicId = req.params.topicId;
  const priority = req.body.priority || 'medium';
  const topic = await getTopicById(topicId);

  if (!topic) {
    throw new ApiError(404, 'Technology topic not found');
  }

  await pool.query(
    `INSERT INTO user_technology_topics (id, user_id, topic_id, priority)
     VALUES (UUID(), ?, ?, ?)
     ON DUPLICATE KEY UPDATE priority = VALUES(priority), updated_at = NOW()`,
    [req.user.id, topicId, priority],
  );

  res.status(200).json({
    message: 'Topic followed',
    topicId,
    priority,
  });
});

export const unfollowTopic = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM user_technology_topics WHERE user_id = ? AND topic_id = ?',
    [req.user.id, req.params.topicId],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Followed topic not found');
  }

  res.status(200).json({ message: 'Topic unfollowed' });
});

export const listInsights = asyncHandler(async (req, res) => {
  const { topicId, status, q } = req.query;
  const where = ['user_id = ?'];
  const params = [req.user.id];

  if (topicId) {
    where.push('topic_id = ?');
    params.push(topicId);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (q) {
    where.push('(title LIKE ? OR content LIKE ? OR source_url LIKE ?)');
    const likeValue = `%${q}%`;
    params.push(likeValue, likeValue, likeValue);
  }

  const [rows] = await pool.query(
    `SELECT id, topic_id, title, content, source_url, tags, status, created_at, updated_at
     FROM technology_insights
     WHERE ${where.join(' AND ')}
     ORDER BY updated_at DESC`,
    params,
  );

  res.status(200).json(rows.map(mapInsight));
});

export const createInsight = asyncHandler(async (req, res) => {
  const { topicId, title, content, sourceUrl, tags, status } = req.body;
  const topic = await getTopicById(topicId);

  if (!topic) {
    throw new ApiError(404, 'Technology topic not found');
  }

  const insightId = randomUUID();
  await pool.query(
    `INSERT INTO technology_insights
      (id, user_id, topic_id, title, content, source_url, tags, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      insightId,
      req.user.id,
      topicId,
      title.trim(),
      content,
      sourceUrl || null,
      JSON.stringify(tags || []),
      status || 'Collected',
    ],
  );

  const [rows] = await pool.query(
    `SELECT id, topic_id, title, content, source_url, tags, status, created_at, updated_at
     FROM technology_insights
     WHERE id = ?
     LIMIT 1`,
    [insightId],
  );

  res.status(201).json(mapInsight(rows[0]));
});

export const updateInsight = asyncHandler(async (req, res) => {
  const { topicId, title, content, sourceUrl, tags, status } = req.body;
  const fields = [];
  const params = [];

  if (topicId !== undefined) {
    const topic = await getTopicById(topicId);
    if (!topic) {
      throw new ApiError(404, 'Technology topic not found');
    }
    fields.push('topic_id = ?');
    params.push(topicId);
  }
  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title.trim());
  }
  if (content !== undefined) {
    fields.push('content = ?');
    params.push(content);
  }
  if (sourceUrl !== undefined) {
    fields.push('source_url = ?');
    params.push(sourceUrl || null);
  }
  if (tags !== undefined) {
    fields.push('tags = ?');
    params.push(JSON.stringify(tags));
  }
  if (status !== undefined) {
    fields.push('status = ?');
    params.push(status);
  }

  if (fields.length === 0) {
    throw new ApiError(400, 'No valid fields provided for update');
  }

  fields.push('updated_at = NOW()');
  params.push(req.params.insightId, req.user.id);

  const [result] = await pool.query(
    `UPDATE technology_insights
     SET ${fields.join(', ')}
     WHERE id = ? AND user_id = ?`,
    params,
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Insight not found');
  }

  const [rows] = await pool.query(
    `SELECT id, topic_id, title, content, source_url, tags, status, created_at, updated_at
     FROM technology_insights
     WHERE id = ?
     LIMIT 1`,
    [req.params.insightId],
  );

  res.status(200).json(mapInsight(rows[0]));
});

export const deleteInsight = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM technology_insights WHERE id = ? AND user_id = ?',
    [req.params.insightId, req.user.id],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Insight not found');
  }

  res.status(200).json({ message: 'Insight deleted' });
});

export const generateBrief = asyncHandler(async (req, res) => {
  const { topicId, insightIds } = req.body;
  const topic = await getTopicById(topicId);

  if (!topic) {
    throw new ApiError(404, 'Technology topic not found');
  }
  if (!Array.isArray(insightIds) || insightIds.length === 0) {
    throw new ApiError(400, 'insightIds must be a non-empty array');
  }

  const placeholders = insightIds.map(() => '?').join(', ');
  const [insights] = await pool.query(
    `SELECT id, title, content, tags
     FROM technology_insights
     WHERE user_id = ? AND topic_id = ? AND id IN (${placeholders})`,
    [req.user.id, topicId, ...insightIds],
  );

  if (insights.length === 0) {
    throw new ApiError(404, 'No matching insights found for this topic');
  }

  const normalizedInsights = insights.map((insight) => ({
    ...insight,
    tags: parseJson(insight.tags, []),
  }));
  const generated = generateBriefFromInsights(topic.name, normalizedInsights);
  const briefId = randomUUID();

  await pool.query(
    `INSERT INTO technology_briefs
      (id, user_id, topic_id, summary, key_points, opportunities, risks, source_insight_ids)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      briefId,
      req.user.id,
      topicId,
      generated.summary,
      JSON.stringify(generated.keyPoints),
      JSON.stringify(generated.opportunities),
      JSON.stringify(generated.risks),
      JSON.stringify(insightIds),
    ],
  );

  const [rows] = await pool.query(
    `SELECT id, topic_id, summary, key_points, opportunities, risks, source_insight_ids, created_at, updated_at
     FROM technology_briefs
     WHERE id = ?
     LIMIT 1`,
    [briefId],
  );

  res.status(201).json(mapBrief(rows[0]));
});

export const generateOutline = asyncHandler(async (req, res) => {
  const { topicId, briefId, tone, targetLength } = req.body;
  const topic = await getTopicById(topicId);

  if (!topic) {
    throw new ApiError(404, 'Technology topic not found');
  }

  const [briefRows] = await pool.query(
    `SELECT id, topic_id, summary, key_points, opportunities, risks, source_insight_ids
     FROM technology_briefs
     WHERE id = ? AND user_id = ? AND topic_id = ?
     LIMIT 1`,
    [briefId, req.user.id, topicId],
  );

  if (briefRows.length === 0) {
    throw new ApiError(404, 'Brief not found');
  }

  const brief = {
    ...briefRows[0],
    keyPoints: parseJson(briefRows[0].key_points, []),
  };

  const outline = generateOutlineFromBrief(topic.name, brief, { tone, targetLength });
  const outlineId = randomUUID();

  await pool.query(
    `INSERT INTO technology_outlines
      (id, user_id, topic_id, brief_id, title, thesis, sections, tone, target_length)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      outlineId,
      req.user.id,
      topicId,
      briefId,
      outline.title,
      outline.thesis,
      JSON.stringify(outline.sections),
      outline.tone,
      outline.targetLength,
    ],
  );

  const [rows] = await pool.query(
    `SELECT id, topic_id, brief_id, title, thesis, sections, tone, target_length, created_at, updated_at
     FROM technology_outlines
     WHERE id = ?
     LIMIT 1`,
    [outlineId],
  );

  res.status(201).json(mapOutline(rows[0]));
});

export const createEssayFromOutline = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, thesis, sections
     FROM technology_outlines
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [req.params.outlineId, req.user.id],
  );

  if (rows.length === 0) {
    throw new ApiError(404, 'Outline not found');
  }

  const outline = rows[0];
  const sections = parseJson(outline.sections, []);
  const sectionText = sections
    .map((section, index) => `## ${index + 1}. ${section.heading}\n${section.objective || ''}`.trim())
    .join('\n\n');
  const content = `${outline.thesis}\n\n${sectionText}`.trim();

  const essayId = randomUUID();
  const wordCount = countWords(content);

  await pool.query(
    `INSERT INTO essays (id, user_id, title, content, status, word_count, ai_suggestions)
     VALUES (?, ?, ?, ?, 'Drafting', ?, 0)`,
    [essayId, req.user.id, outline.title, content, wordCount],
  );

  const [essayRows] = await pool.query(
    `SELECT id, title, content, status, word_count, ai_suggestions, created_at, updated_at
     FROM essays
     WHERE id = ?
     LIMIT 1`,
    [essayId],
  );

  const essay = essayRows[0];
  res.status(201).json({
    id: essay.id,
    title: essay.title,
    content: essay.content,
    status: essay.status,
    wordCount: essay.word_count,
    aiSuggestions: essay.ai_suggestions,
    createdAt: essay.created_at,
    updatedAt: essay.updated_at,
  });
});
