require('dotenv').config();
const connectDB = require('./config/db');

const metakockaRoutes = require('./routes/metakocka');
const authRoutes = require('./routes/auth');
const secureRoutes = require('./routes/secure');
const workOrdersRoutes = require('./routes/workOrders1'); // Preimenovana datoteka
const termPlanRoutes = require('./routes/termPlanRouter'); // NOV ROUTER za terminski plan
const ordersRouter = require('./routes/ordersRouter');

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Globalno logiranje vseh dohodnih zahtev
app.use((req, res, next) => {
  console.log(`Prejeta zahtevek: ${req.method} ${req.url}`);
  next();
});

// Registracija poti
app.use('/api/auth', authRoutes);
app.use('/api/metakocka', metakockaRoutes);
app.use('/api/secure', secureRoutes);
app.use('/api/workorders', workOrdersRoutes);
app.use('/api/termplans', termPlanRoutes); // Registriraj nov router
app.use('/api/orders', ordersRouter);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Pozdravljen v API-ju za Steklarstvo!');
});

connectDB();
app.listen(PORT, () => {
  console.log(`Strežnik teče na http://localhost:${PORT}`);
});
