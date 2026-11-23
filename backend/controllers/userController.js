const pool = require('../config/db');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      `SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    const [preferences] = await pool.query(
      'SELECT music_type FROM user_music_preferences WHERE user_id = ?',
      [userId]
    );
    user.music_preferences = preferences.map(p => p.music_type);

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { phone, vocal_trainer_name, selected_musical_goal, types_of_music } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE users 
         SET phone = COALESCE(?, phone),
             vocal_trainer_name = ?,
             selected_musical_goal = COALESCE(?, selected_musical_goal)
         WHERE id = ?`,
        [phone || null, vocal_trainer_name !== undefined ? vocal_trainer_name : null, selected_musical_goal || null, userId]
      );

      if (Array.isArray(types_of_music)) {
        await connection.query('DELETE FROM user_music_preferences WHERE user_id = ?', [userId]);
        if (types_of_music.length > 0) {
          const values = types_of_music.map(m => [userId, m]);
          await connection.query('INSERT INTO user_music_preferences (user_id, music_type) VALUES ?', [values]);
        }
      }

      await connection.commit();

      const [updated] = await connection.query(
        'SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, updated_at FROM users WHERE id = ?',
        [userId]
      );
      const [prefs] = await connection.query('SELECT music_type FROM user_music_preferences WHERE user_id = ?', [userId]);
      const user = updated[0];
      user.music_preferences = prefs.map(p => p.music_type);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};
