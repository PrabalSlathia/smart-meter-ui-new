// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const express = require('express');
// const path = require('path');
// const app = express();

// // 1. Tell Express to look for your index.html in the main folder
// app.use(express.static(path.join(__dirname)));

// // 2. Middleware to parse JSON data from your Raspberry Pi
// app.use(express.json());

// // 3. Link your API file (the one that talks to Firebase)
// // Note: We use require().default because of the 'export default' in data.js
// const dataHandler = require('./api/data').default || require('./api/data');

// app.all('/api/data', (req, res) => {
//     return dataHandler(req, res);
// });

// // 4. Fallback: If someone goes to any other link, show the dashboard
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// module.exports = app;

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dataHandler from './api/data.js';

// These two lines are REQUIRED for ES Modules (type: module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Tell Express to serve your index.html automatically
app.use(express.static(__dirname));

// 2. Link your working API
app.all('/api/data', dataHandler);

// 3. Fallback: If someone visits "/", send the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

export default app;