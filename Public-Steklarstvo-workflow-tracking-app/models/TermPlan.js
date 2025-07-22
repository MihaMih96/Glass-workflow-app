const mongoose = require('mongoose');

const TermPlanSchema = new mongoose.Schema({
  weekKey: { type: String, unique: true, required: true }, // npr. "2025-02-24"
  gridData: { type: Array, default: [] }, // shranimo grid podatke (array vrstic)
  dayNotes: { type: Array, default: () => Array(5).fill("") }, // vedno 5 praznih stringov
  lock: {
    type: Object,
    default: null, 
    // { username: "Miha", timestamp: 172234567890 }
  }
});

module.exports = mongoose.model('TermPlan', TermPlanSchema);
