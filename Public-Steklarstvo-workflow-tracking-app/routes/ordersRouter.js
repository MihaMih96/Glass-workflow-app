const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET all orders
router.get('/', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// POST new order
router.post('/', async (req, res) => {
  const { item, quantity, unit, createdBy } = req.body;
  const order = new Order({ item, quantity, unit, createdBy });
  await order.save();
  res.status(201).json(order);
});

// PATCH mark as ordered
router.patch('/:id/ordered', async (req, res) => {
  const { orderedBy } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: 'ordered', orderedAt: new Date(), orderedBy },
    { new: true }
  );
  res.json(order);
});

// PATCH - urejanje naročila (item, quantity, createdBy)
router.patch('/:id', async (req, res) => {
  const { item, quantity, unit, createdBy } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { item, quantity, unit, createdBy },
    { new: true }
  );
  res.json(order);
});

// DELETE - izbris naročila
router.delete('/:id', async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
