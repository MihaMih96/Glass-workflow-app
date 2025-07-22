// routes/secure.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Ta endpoint bo dostopen samo, če je priložen veljaven JWT token
router.get('/me', authMiddleware, (req, res) => {
  res.json({ 
    message: 'Dostop do zaščitenih podatkov je dovoljen.',
    user: req.user
  });
});

module.exports = router;
