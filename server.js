const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const key = (process.env.ANTHROPIC_API_KEY || '').trim();
  html = html.replace(/REPLACE_WITH_VON_KEY/g, key);
  html = html.replace(/let API_KEY = sessionStorage[\s\S]*?}\s*}/m, `const API_KEY = "${key}";`);
  res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Front Desk AI running on port ${PORT}`);
});
