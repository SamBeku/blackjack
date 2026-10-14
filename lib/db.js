import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// SQLite andmebaas on üks fail: data/blackjack.db (gitis seda pole)
let db;

function getDb() {
  if (!db) {
    const dir = path.join(process.cwd(), 'data');
    mkdirSync(dir, { recursive: true });
    db = new DatabaseSync(path.join(dir, 'blackjack.db'));
    db.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        balance INTEGER NOT NULL,
        hands INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

export function getTopScores(limit = 10) {
  return getDb()
    .prepare(
      'SELECT id, name, balance, hands, created_at FROM scores ORDER BY balance DESC, created_at ASC LIMIT ?',
    )
    .all(limit);
}

export function addScore({ name, balance, hands }) {
  getDb().prepare('INSERT INTO scores (name, balance, hands) VALUES (?, ?, ?)').run(name, balance, hands);
}
