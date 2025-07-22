// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  item: { type: String, required: true },       // Kaj je treba naročiti
  quantity: { type: Number, required: true },   // Količina
  unit: { type: String, default: "Kos" },
  status: { type: String, enum: ['pending', 'ordered'], default: 'pending' },
  orderedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }, // Uporabnik, ki je dodal (lahko dodaš kasneje)
  orderedBy: { type: String }  // Kdo je označil kot naročeno (opcijsko)
});

module.exports = mongoose.model('Order', OrderSchema);
