// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Preveri, ali obstaja header "Authorization"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Avtentikacija zahtevana.' });
  }

  // Običajno je token poslan kot "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token ni podan.' });
  }

  try {
    // Preveri token s skrivnim ključem iz .env (JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Shranimo informacije o uporabniku v req.user za nadaljnjo uporabo
    req.user = decoded;
    next(); // Token je veljaven – nadaljuj z naslednjim handlerjem
  } catch (err) {
    console.error("JWT preverjanje napaka:", err);
    return res.status(401).json({ error: 'Neveljaven ali potekel token.' });
  }
};

module.exports = authMiddleware;
