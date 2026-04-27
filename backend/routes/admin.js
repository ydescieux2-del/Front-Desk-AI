const express = require('express');
const router = express.Router();
const { getAllLeads } = require('../db/queries');

router.get('/leads', (req, res) => {
  const leads = getAllLeads(200);
  res.json(leads);
});

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname + '/../dashboard' });
});

module.exports = router;
