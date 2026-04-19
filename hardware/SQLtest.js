'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'realtime.db');

// 1. DBオープン
const db = new Database(DB_PATH);

// WALモードは高速ですが、異常終了時にログファイルが残るため、
// 今回のような「容量を最小限にしたい」場合は DELETE（標準）に戻すのも手です。
db.pragma('journal_mode = DELETE'); 
db.pragma('synchronous = NORMAL');

// 2. テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS ticks (
    i      INTEGER PRIMARY KEY AUTOINCREMENT,
    ts_ms  INTEGER NOT NULL,
    ts_iso TEXT    NOT NULL
  );
`);

const insert = db.prepare(`INSERT INTO ticks (ts_ms, ts_iso) VALUES (?, ?)`);

let count = 0;
const MAX_ROWS = 1000; // 【追加】安全装置：1000行超えたら自動停止（容量保護）

function logOnce() {
  if (count >= MAX_ROWS) {
    console.log('--- 安全のため自動停止しました（最大行数到達） ---');
    shutdown();
    return;
  }

  const now = Date.now();
  const iso = new Date(now).toISOString();
  
  try {
    const info = insert.run(now, iso);
    count++;
    console.log(`[${count}/${MAX_ROWS}] i=${info.lastInsertRowid} ts=${iso}`);
  } catch (err) {
    console.error("書き込みエラー:", err.message);
    shutdown();
  }
}

// 実行開始
console.log(`記録開始: ${DB_PATH}`);
logOnce();
const timer = setInterval(logOnce, 1000);

// 3. 終了処理（これをしっかり行うことでファイル肥大化を防ぎます）
function shutdown() {
  console.log('\nデータベースを安全に閉じています...');
  clearInterval(timer);
  try {
    db.close();
    console.log('完了。');
  } catch (e) {
    // すでに閉じている場合は無視
  }
  process.exit(0);
}

// Ctrl+C などを検知
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);