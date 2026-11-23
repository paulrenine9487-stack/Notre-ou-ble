const pool = require('../config/db');

// GET /api/songs - List all songs for authenticated user
exports.getSongs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [songs] = await pool.query(
      `SELECT 
         s.id,
         s.song_title,
         s.language,
         s.song_type,
         s.notes,
         s.created_at,
         COUNT(p.id) AS total_phrases,
         SUM(CASE WHEN p.completion_status = 'completed' THEN 1 ELSE 0 END) AS completed_phrases
       FROM user_song_practice s
       LEFT JOIN song_practice_phrases p ON s.id = p.song_practice_id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      songs
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/songs - Create new song for practice
exports.createSong = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { song_title, language, song_type, notes, initial_phrases } = req.body;

    if (!song_title || !song_title.trim()) {
      return res.status(400).json({ success: false, message: 'Song title is required.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [songResult] = await conn.query(
        `INSERT INTO user_song_practice (user_id, song_title, language, song_type, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          song_title.trim(),
          language ? language.trim() : 'English',
          song_type ? song_type.trim() : 'Ballad / Classical',
          notes ? notes.trim() : null
        ]
      );
      const songId = songResult.insertId;

      // If initial phrases provided, insert them
      if (Array.isArray(initial_phrases) && initial_phrases.length > 0) {
        for (let i = 0; i < initial_phrases.length; i++) {
          const phrase = initial_phrases[i];
          await conn.query(
            `INSERT INTO song_practice_phrases 
               (song_practice_id, phrase_number, phrase_text, inhale_position, exhale_guidance, practice_notes, completion_status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              songId,
              phrase.phrase_number || (i + 1),
              phrase.phrase_text || `Phrase ${i + 1}`,
              phrase.inhale_position || 'Before phrase (deep 360° diaphragmatic inhale)',
              phrase.exhale_guidance || 'Controlled steady airflow throughout vocal line',
              phrase.practice_notes || null,
              phrase.completion_status || 'pending'
            ]
          );
        }
      }

      await conn.commit();

      const [newSong] = await pool.query('SELECT * FROM user_song_practice WHERE id = ?', [songId]);
      const [phrases] = await pool.query('SELECT * FROM song_practice_phrases WHERE song_practice_id = ? ORDER BY phrase_number ASC', [songId]);

      res.status(201).json({
        success: true,
        message: 'Song practice created successfully.',
        song: newSong[0],
        phrases
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/songs/:songId/phrases - Get all phrases for a specific song
exports.getSongPhrases = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const songId = parseInt(req.params.songId, 10);

    // Verify ownership
    const [song] = await pool.query(
      'SELECT * FROM user_song_practice WHERE id = ? AND user_id = ?',
      [songId, userId]
    );
    if (song.length === 0) {
      return res.status(404).json({ success: false, message: 'Song not found or access denied.' });
    }

    const [phrases] = await pool.query(
      'SELECT * FROM song_practice_phrases WHERE song_practice_id = ? ORDER BY phrase_number ASC',
      [songId]
    );

    res.status(200).json({
      success: true,
      song: song[0],
      phrases
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/songs/:songId/phrases - Add phrase to song
exports.addPhrase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const songId = parseInt(req.params.songId, 10);
    const { phrase_number, phrase_text, inhale_position, exhale_guidance, practice_notes } = req.body;

    // Verify ownership
    const [song] = await pool.query(
      'SELECT id FROM user_song_practice WHERE id = ? AND user_id = ?',
      [songId, userId]
    );
    if (song.length === 0) {
      return res.status(404).json({ success: false, message: 'Song not found or access denied.' });
    }

    if (!phrase_text || !phrase_text.trim()) {
      return res.status(400).json({ success: false, message: 'Phrase lyric/text is required.' });
    }

    // Determine phrase number if not supplied
    let pNum = parseInt(phrase_number, 10);
    if (isNaN(pNum)) {
      const [maxRows] = await pool.query(
        'SELECT COALESCE(MAX(phrase_number), 0) + 1 AS nextNum FROM song_practice_phrases WHERE song_practice_id = ?',
        [songId]
      );
      pNum = maxRows[0].nextNum;
    }

    const [result] = await pool.query(
      `INSERT INTO song_practice_phrases 
         (song_practice_id, phrase_number, phrase_text, inhale_position, exhale_guidance, practice_notes, completion_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        songId,
        pNum,
        phrase_text.trim(),
        inhale_position || 'Before phrase (360° inhale)',
        exhale_guidance || 'Steady supported air stream',
        practice_notes || null
      ]
    );

    const [newPhrase] = await pool.query('SELECT * FROM song_practice_phrases WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Phrase added successfully.',
      phrase: newPhrase[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/songs/phrases/:phraseId - Update phrase breathing points & status
exports.updatePhrase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const phraseId = parseInt(req.params.phraseId, 10);
    const { phrase_text, inhale_position, exhale_guidance, practice_notes, completion_status } = req.body;

    // Verify ownership via join
    const [existing] = await pool.query(
      `SELECT p.id, p.song_practice_id 
       FROM song_practice_phrases p
       JOIN user_song_practice s ON p.song_practice_id = s.id
       WHERE p.id = ? AND s.user_id = ?`,
      [phraseId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Phrase not found or access denied.' });
    }

    const updates = [];
    const values = [];

    if (phrase_text !== undefined) {
      updates.push('phrase_text = ?');
      values.push(phrase_text.trim());
    }
    if (inhale_position !== undefined) {
      updates.push('inhale_position = ?');
      values.push(inhale_position.trim());
    }
    if (exhale_guidance !== undefined) {
      updates.push('exhale_guidance = ?');
      values.push(exhale_guidance.trim());
    }
    if (practice_notes !== undefined) {
      updates.push('practice_notes = ?');
      values.push(practice_notes.trim());
    }
    if (completion_status !== undefined) {
      updates.push('completion_status = ?');
      values.push(completion_status);
    }

    if (updates.length > 0) {
      values.push(phraseId);
      await pool.query(
        `UPDATE song_practice_phrases SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updated] = await pool.query('SELECT * FROM song_practice_phrases WHERE id = ?', [phraseId]);

    res.status(200).json({
      success: true,
      message: 'Phrase updated successfully.',
      phrase: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/songs/phrases/:phraseId
exports.deletePhrase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const phraseId = parseInt(req.params.phraseId, 10);

    const [existing] = await pool.query(
      `SELECT p.id FROM song_practice_phrases p
       JOIN user_song_practice s ON p.song_practice_id = s.id
       WHERE p.id = ? AND s.user_id = ?`,
      [phraseId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Phrase not found or access denied.' });
    }

    await pool.query('DELETE FROM song_practice_phrases WHERE id = ?', [phraseId]);

    res.status(200).json({
      success: true,
      message: 'Phrase deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/songs/:id
exports.deleteSong = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const songId = parseInt(req.params.id, 10);

    const [existing] = await pool.query(
      'SELECT id FROM user_song_practice WHERE id = ? AND user_id = ?',
      [songId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Song not found or access denied.' });
    }

    await pool.query('DELETE FROM user_song_practice WHERE id = ?', [songId]);

    res.status(200).json({
      success: true,
      message: 'Song practice deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
