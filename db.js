const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');

const dbPath = path.join(__dirname, 'reading_mission.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for performance and integrity
db.exec('PRAGMA foreign_keys = ON;');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    grade INTEGER NOT NULL,
    class_number INTEGER NOT NULL,
    pin_hash TEXT NOT NULL,
    selected_missions TEXT NOT NULL, -- JSON array: ["time", "pages"]
    total_minutes INTEGER NOT NULL DEFAULT 0,
    total_pages INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade, class_number)
  );

  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'time' or 'pages'
    amount INTEGER NOT NULL,
    book_title TEXT,
    student_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );
`);

// Safe column migration for book_title if existing
try {
  db.exec('ALTER TABLE records ADD COLUMN book_title TEXT;');
} catch (e) {
  // column already exists
}

// PIN hashing helper using SHA-256 with salt
function hashPin(pin) {
  const salt = '7942_reading_salt_2026';
  return crypto.createHash('sha256').update(pin + salt).digest('hex');
}

// Generate random session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Format class ID
function formatClassId(grade, classNumber) {
  return `${grade}-${classNumber}`;
}

module.exports = {
  db,
  hashPin,
  generateToken,
  formatClassId
};
