const fetch = require('node-fetch');

// Change this to your actual Vercel URL
const VERCEL_API_URL = 'https://your-project.vercel.app/api/data'; 

async function sendFakeData() {
    const fakeData = {
        power: Math.floor(Math.random() * 500), // Random Watts between 0-500
        importKwh: 1234.56,
        exportKwh: 0.00,
        raw_data: { status: "SIMULATED_TEST" }
    };

    console.log(`[Simulating] Sending ${fakeData.power}W to Vercel...`);

    try {
        const response = await fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fakeData)
        });
        if (response.ok) console.log("✅ Mock data sent!");
    } catch (err) {
        console.error("❌ Failed to reach Vercel:", err.message);
    }
}

// Send data every 5 seconds
setInterval(sendFakeData, 5000);
sendFakeData();