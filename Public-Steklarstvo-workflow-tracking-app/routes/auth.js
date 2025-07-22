// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  console.log("POST /api/auth/login prejme zahtevek, telo:", req.body);
  const { username, password } = req.body;
  try {
    // Poišči uporabnika
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Neveljaven username ali geslo.' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Neveljaven username ali geslo.' });
    
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error("Napaka pri prijavi:", err);
    res.status(500).json({ error: 'Napaka pri prijavi.' });
  }
});

module.exports = router;
