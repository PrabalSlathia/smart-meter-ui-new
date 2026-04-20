import SmartmeterObis from 'smartmeter-obis';
import fetch from 'node-fetch';

const VERCEL_API_URL = 'https://smart-meter-chi.vercel.app/api/data';

// 1. Create a variable to hold the last valid data from the sensor
let latestObisData = null;

const options = {
    protocol: "SmlProtocol",
    transport: "SerialResponseTransport",
    transportSerialPort: "/dev/COM5", 
    transportSerialBaudrate: 9600,
    obisNameLanguage: 'en',
    obisFallbackMedium: 6
};

async function sendToCloud() {
    // If we haven't received ANY data from the sensor yet, don't send anything
    if (!latestObisData) {
        console.log(`[${new Date().toLocaleTimeString()}] ⏳ Waiting for first sensor reading...`);
        return;
    }

    const data = {
        power: latestObisData['1-0:16.7.0*255']?.value || 0,
        importKwh: latestObisData['1-0:1.8.0*255']?.value || 0,
        exportKwh: latestObisData['1-0:2.8.0*255']?.value || 0,
        raw_data: latestObisData
    };

    console.log(`[${new Date().toLocaleTimeString()}] ☁️ Pushing to Cloud: ${data.power}W`);

    try {
        const response = await fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log("✅ Upload Successful");
        } else {
            console.error("❌ Upload Failed:", response.statusText);
        }
    } catch (err) {
        console.error("❌ Network Error:", err.message);
    }
}

// 2. This function ONLY updates our local variable
function handleSensorData(err, obisResult) {
    if (err) {
        console.error("Sensor Error:", err);
        setTimeout(() => smTransport.process(), 5000);
        return;
    }
    
    // Just update the latest data in memory
    latestObisData = obisResult;
    
    // Keep the sensor listener active
    smTransport.process();
}

// 3. START THE PROCESSES
console.log("🚀 Starting Smart Meter Bridge (10s Interval)...");
const smTransport = SmartmeterObis.init(options, handleSensorData);
smTransport.process();

// 4. TRIGGER UPLOAD EVERY 10 SECONDS
setInterval(sendToCloud, 10000);
