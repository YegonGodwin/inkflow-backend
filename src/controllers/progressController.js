import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export const getOverview = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT status, word_count, updated_at
     FROM essays
     WHERE user_id = ?`,
    [req.user.id],
  );

  const totalWords = rows.reduce((sum, row) => sum + Number(row.word_count || 0), 0);
  const essaysFinished = rows.filter((row) => row.status === 'Ready').length;
  const essaysInDraft = rows.filter((row) => row.status !== 'Ready').length;

  const dailyBuckets = {};
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = isoDate(date);
    days.push({
      dateKey,
      day: WEEKDAY_LABELS[date.getDay()],
    });
    dailyBuckets[dateKey] = 0;
  }

  for (const row of rows) {
    const updatedKey = isoDate(row.updated_at);
    if (dailyBuckets[updatedKey] !== undefined) {
      dailyBuckets[updatedKey] += Number(row.word_count || 0);
    }
  }

  const weeklyActivity = days.map((day) => ({
    day: day.day,
    count: dailyBuckets[day.dateKey],
  }));

  res.status(200).json({
    totalWords,
    essaysFinished,
    essaysInDraft,
    weeklyActivity,
  });
});
