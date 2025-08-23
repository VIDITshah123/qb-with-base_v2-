const crypto = require('crypto');
const db = require('../db');

class PasswordResetToken {
  static async create(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    await db.run(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt.toISOString()]
    );
    
    return token;
  }

  static async findValid(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT prt.*, u.user_email as email 
         FROM password_reset_tokens prt
         JOIN base_master_users u ON prt.user_id = u.user_id
         WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')`,
        [token],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
  }

  static async markAsUsed(token) {
    await db.run(
      'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      [token]
    );
  }
}

module.exports = PasswordResetToken;
