var admin = require("firebase-admin");

const serviceAccount = require('./smart-meter-project-497ac-firebase-adminsdk-fbsvc-98a2a903d2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const SmartmeterObis = require('smartmeter-obis');
const path = require('path');
const express = require('express');

// --- Firebaseデータベースクライアントの取得 ---
// Cloud Firestore を使う場合:
const firestoreDb = admin.firestore();

// Firebase Realtime Database は使わないのでコメントアウトまたは削除します。
// const rtdb = admin.database();

// --- データベースの準備 (SQLiteの部分は削除) ---
// const db = new Database('sensor_data.db');
// db.prepare(`...`).run();


const options = {
    protocol: "SmlProtocol",
    transport: "SerialResponseTransport",
    transportSerialPort: "/dev/tty.usbserial-130",
    transportSerialBaudrate: 9600,
    obisNameLanguage: 'en',
    obisFallbackMedium: 6
};

// --- APIサーバーの準備 (フロントエンド用) ---
const app = express();
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Cloud Firestore からデータを取得するためのAPIエンドポイント
app.get('/api/data', async (req, res) => {
    try {
        // 'meter_readings'コレクションから最新の100件のデータを取得
        const snapshot = await firestoreDb.collection('meter_readings')
                                          .orderBy('timestamp', 'desc') // 最新のものを取得
                                          .limit(100)
                                          .get();
        // 取得したドキュメントを整形してレスポンスとして返す
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(data);
    } catch (err) {
        console.error("API Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("API Server: http://localhost:3000"));


// --- データ受信時の処理 ---
// --- 1. 受信時の処理を修正してCloud Firestoreに保存 ---
async function displayAndSaveData(err, obisResult) {
    if (err) return console.error(err);

    const power = obisResult['1-0:16.7.0*255']?.value || 0;
    const importKwh = obisResult['1-0:1.8.0*255']?.value || 0;
    const exportKwh = obisResult['1-0:2.8.0*255']?.value || 0;

    console.log(`Saving to Cloud Firestore... 電力: ${power}W, 受電: ${importKwh}kWh`);
    try {
        await firestoreDb.collection('meter_readings').add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(), // Firestore のサーバータイムスタンプを使用
            active_power_w: power,
            total_import_kwh: importKwh,
            total_export_kwh: exportKwh,
            raw_data: JSON.stringify(obisResult)
        });
        console.log("Data successfully written to Cloud Firestore!");
    } catch (error) {
        console.error("Error writing document to Cloud Firestore: ", error);
    }

    // 次の受信待機
    smTransport.process();
}

// --- 2. 最初の1回目をキックする ---
const smTransport = SmartmeterObis.init(options, displayAndSaveData);
console.log("Starting Smart Meter Reading (Press Ctrl+C to stop)...");

// while(1) ではなく、これ一回でOK
smTransport.process();
