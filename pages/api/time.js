
import pool from '../../lib/db.js';

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.status(200).json({ time: result.rows[0].current_time });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
}
