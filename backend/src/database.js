const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../config/database.sqlite');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initTables();
          resolve();
        }
      });
    });
  }

  initTables() {
    const createUserPatternsTable = `
      CREATE TABLE IF NOT EXISTS user_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createEmailLogsTable = `
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id TEXT NOT NULL,
        subject TEXT,
        sender TEXT,
        body_snippet TEXT,
        matched_patterns TEXT,
        received_at DATETIME,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createScheduleSettingsTable = `
      CREATE TABLE IF NOT EXISTS schedule_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        interval_hours INTEGER DEFAULT 1,
        enabled BOOLEAN DEFAULT 1,
        notification_enabled BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createUserPatternsTable);
    this.db.run(createEmailLogsTable);
    this.db.run(createScheduleSettingsTable);

    this.insertDefaultData();
  }

  insertDefaultData() {
    this.db.get("SELECT COUNT(*) as count FROM user_patterns", (err, row) => {
      if (!err && row.count === 0) {
        const defaultPatterns = [
          { pattern: '田中|tanaka|Tanaka', description: '田中さん関連', enabled: 1 },
          { pattern: '山田.*太郎', description: '山田太郎さん関連', enabled: 1 }
        ];

        defaultPatterns.forEach(pattern => {
          this.db.run(
            "INSERT INTO user_patterns (pattern, description, enabled) VALUES (?, ?, ?)",
            [pattern.pattern, pattern.description, pattern.enabled]
          );
        });
      }
    });

    this.db.get("SELECT COUNT(*) as count FROM schedule_settings", (err, row) => {
      if (!err && row.count === 0) {
        this.db.run(
          "INSERT INTO schedule_settings (start_time, interval_hours, enabled) VALUES (?, ?, ?)",
          ['09:00', 1, 1]
        );
      }
    });
  }

  async getUserPatterns() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM user_patterns WHERE enabled = 1", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async addUserPattern(pattern, description = '') {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO user_patterns (pattern, description) VALUES (?, ?)",
        [pattern, description],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, pattern, description });
          }
        }
      );
    });
  }

  async updateUserPattern(id, pattern, description, enabled) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE user_patterns SET pattern = ?, description = ?, enabled = ? WHERE id = ?",
        [pattern, description, enabled, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async deleteUserPattern(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM user_patterns WHERE id = ?", [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async logEmail(emailData, matchedPatterns) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO email_logs (email_id, subject, sender, body_snippet, matched_patterns, received_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          emailData.id,
          emailData.subject,
          emailData.from,
          emailData.body.substring(0, 200),
          JSON.stringify(matchedPatterns),
          emailData.timestamp
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  async getRecentEmailLogs(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM email_logs ORDER BY logged_at DESC LIMIT ?",
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              ...row,
              matched_patterns: JSON.parse(row.matched_patterns || '[]')
            })));
          }
        }
      );
    });
  }

  async getScheduleSettings() {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM schedule_settings WHERE enabled = 1 LIMIT 1", (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateScheduleSettings(startTime, intervalHours, enabled, notificationEnabled) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE schedule_settings SET start_time = ?, interval_hours = ?, enabled = ?, 
         notification_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [startTime, intervalHours, enabled, notificationEnabled],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database;