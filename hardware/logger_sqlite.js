'use strict';

// 1. データベースを扱うための道具（ライブラリ）を読み込む
const Database = require('better-sqlite3');

// 2. 「realtime.db」という名前のデータベースファイルを作成・接続する
const db = new Database('realtime.db');

// 3. データを保存するための「表（テーブル）」を作る
// ts という名前の列に、時刻（テキスト）を保存する設定
db.exec("CREATE TABLE IF NOT EXISTS ticks (ts TEXT)");

// 書き込み用の命令を準備
const insert = db.prepare("INSERT INTO ticks (ts) VALUES (?)");

console.log("--- 10秒間の書き込みテストを開始します ---");

let count = 0;

// 4. 1秒（1000ミリ秒）ごとに実行するタイマー
const timer = setInterval(() => {
    const now = new Date().toISOString(); // 今の時刻を取得
    
    // 💾 データベースへ保存（書き込み実行！）
    insert.run(now);
    
    count++;
    console.log(`[${count}/10] データベースに書き込み完了: ${now}`);

    // 5. 10回書いたら、勝手にファイルが大きくならないように安全に終了する
    if (count >= 10) {
        clearInterval(timer); // タイマーを止める
        db.close();          // データベースを安全に閉じる
        console.log("--- テスト終了。'realtime.db' ができているはずです ---");
        process.exit();      // プログラムを終了
    }
}, 1000);