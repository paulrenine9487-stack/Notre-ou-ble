const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedAdmins() {
  const salt = await bcrypt.genSalt(10);

  // 1. Superadmin: Notreoblemccmrfip / notreoblesinger
  const superHash = await bcrypt.hash('notreoblesinger', salt);
  
  // Check if Notreoblemccmrfip exists
  const [existingSuper] = await pool.query(
    "SELECT id FROM users WHERE LOWER(username) = 'notreoblemccmrfip' OR LOWER(email) = 'notreoblemccmrfip@notreoble.com'"
  );

  if (existingSuper.length > 0) {
    await pool.query(
      "UPDATE users SET username = 'Notreoblemccmrfip', password_hash = ?, role = 'SUPERADMIN' WHERE id = ?",
      [superHash, existingSuper[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO users (username, gender, email, phone, vocal_trainer_name, password_hash, selected_musical_goal, role)
       VALUES ('Notreoblemccmrfip', 'Other', 'notreoblemccmrfip@notreoble.com', '+919876543211', 'Master Superadmin', ?, 'Platform Administrator', 'SUPERADMIN')`,
      [superHash]
    );
  }

  // 2. Admin: Smirthi / smirthi1234
  const adminHash = await bcrypt.hash('smirthi1234', salt);
  const [existingAdmin] = await pool.query(
    "SELECT id FROM users WHERE LOWER(username) = 'smirthi' OR LOWER(email) = 'smirthi@notreoble.com'"
  );

  if (existingAdmin.length > 0) {
    await pool.query(
      "UPDATE users SET username = 'Smirthi', password_hash = ?, role = 'ADMIN' WHERE id = ?",
      [adminHash, existingAdmin[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO users (username, gender, email, phone, vocal_trainer_name, password_hash, selected_musical_goal, role)
       VALUES ('Smirthi', 'Female', 'smirthi@notreoble.com', '+919876543212', 'Vocal Instructor Smirthi', ?, 'Vocal Pedagogy Trainer', 'ADMIN')`,
      [adminHash]
    );
  }

  const [users] = await pool.query(
    "SELECT id, username, email, role FROM users WHERE LOWER(username) IN ('notreoblemccmrfip', 'smirthi')"
  );
  console.log('Successfully provisioned admin accounts:', users);
}

seedAdmins()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Failed to seed admins:', e);
    process.exit(1);
  });
