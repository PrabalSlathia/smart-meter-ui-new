import app from './index.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Smart meter app running at http://localhost:${PORT}`);
});