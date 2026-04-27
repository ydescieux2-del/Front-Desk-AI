const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'leads.db');

function getDb() {
  return new Database(DB_PATH);
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      service_requested TEXT,
      message TEXT,
      source TEXT DEFAULT 'form',
      lead_type TEXT DEFAULT 'unclassified',
      urgency TEXT DEFAULT 'normal',
      risk_flag INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      follow_up_1_sent INTEGER DEFAULT 0,
      follow_up_2_sent INTEGER DEFAULT 0,
      follow_up_1_at TEXT,
      follow_up_2_at TEXT,
      replied INTEGER DEFAULT 0,
      replied_at TEXT,
      booked INTEGER DEFAULT 0,
      booked_at TEXT,
      disqualified INTEGER DEFAULT 0,
      classification_json TEXT,
      first_reply_sent INTEGER DEFAULT 0,
      first_reply_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      email_type TEXT,
      subject TEXT,
      body TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS agent_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      agent TEXT,
      input_summary TEXT,
      output_summary TEXT,
      tokens_used INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(lead_id) REFERENCES leads(id)
    );
  `);

  console.log('✅ Database initialized at', DB_PATH);
  db.close();
}

module.exports = { getDb, initDb };

if (require.main === module) {
  initDb();
}
