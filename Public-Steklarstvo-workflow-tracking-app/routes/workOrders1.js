// routes/workOrders1.js
const express = require('express');
const router = express.Router();
const { fetchWorkOrder } = require('../services/metakockaService');
const processWorkOrderDataBackend = require('../utils/processWorkOrderData');
const WorkOrder = require('../models/WorkOrder');

// Pomožne funkcije za mapping datumov in list
function parseDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.substring(0, 10).split('-');
  return new Date(+year, +month - 1, +day);
}
function formatDateToString(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function mapWorkPlanList(arr = []) {
  return arr.map(item => ({
    ...item,
    when: item.when ? parseDate(item.when) : null
  }));
}
function mapProductRealizationList(arr = []) {
  return arr.map(item => ({
    ...item,
    when: item.when ? parseDate(item.when) : null,
    work_plan_list: mapWorkPlanList(item.work_plan_list || []),
    sprayStatus: typeof item.sprayStatus === 'number' ? item.sprayStatus : 0
  }));
}
function mapMaterialPlanList(arr = []) {
  return arr.map(item => ({
    ...item,
    when: item.when ? parseDate(item.when) : null
  }));
}

// GET /api/workorders/          → vrne vse shranjene naloge
router.get('/', async (req, res) => {
  try {
    const workOrders = await WorkOrder.find();
    res.json(workOrders);
  } catch (err) {
    console.error('Napaka pri pridobivanju delovnih nalogov:', err);
    res.status(500).json({ error: 'Napaka pri pridobivanju delovnih nalogov.' });
  }
});

// GET /api/workorders/:docId    → prebere iz baze; če ni, uvozi iz API-ja samo za prikaz
router.get('/:docId', async (req, res) => {
  try {
    const id = req.params.docId;

    // 1) Če že obstaja v bazi, vrnemo
    const existing = await WorkOrder.findOne({ mk_id: id });
    if (existing) {
      return res.json(existing);
    }

    // 2) Ni v bazi → kliče zunanji API
    let data;
    try {
      data = await fetchWorkOrder(id);
    } catch (err) {
      const status = err.response?.status || 500;
      return res.status(status).json({ error: 'Delovni nalog ni najden.' });
    }

    // 3) Preverimo, ali API res vrne kaj uporabnega
    const hasContent =
      (Array.isArray(data.create_product_realization_list) && data.create_product_realization_list.length > 0) ||
      data.doc_date ||
      data.doc_date_created;
    if (!hasContent) {
      return res.status(404).json({ error: 'Delovni nalog nima podatkov.' });
    }

    // 4) Preslikamo podatke kot prej, a NE zapisujemo v bazo
    const mapped = {
      mk_id: data.mk_id || id,
      doc_type: data.doc_type,
      opr_code: data.opr_code,
      count_code: data.count_code,
      doc_date: data.doc_date ? parseDate(data.doc_date) : null,
      doc_date_created: data.doc_date_created ? parseDate(data.doc_date_created) : null,
      partner: data.partner,
      sales_pricelist_code: data.sales_pricelist_code,
      purchase_pricelist_list: data.purchase_pricelist_list || [],
      title: data.title,
      start_date: data.start_date ? parseDate(data.start_date) : null,
      produce_deadline_date: data.produce_deadline_date
        ? formatDateToString(parseDate(data.produce_deadline_date))
        : null,
      caretaker_list: data.caretaker_list || [],
      sum_sales_plan: data.sum_sales_plan,
      create_product_realization_list: mapProductRealizationList(data.create_product_realization_list),
      material_plan_list: mapMaterialPlanList(data.material_plan_list),
      completed: data.completed || [],
      path: data.path || [],
      confirmedDate: data.confirmedDate ? parseDate(data.confirmedDate) : null
    };

    // 5) Dodatna finalna logika (cellId, sektor…) brez shranjevanja
    const finalData = processWorkOrderDataBackend(mapped);

    return res.json(finalData);

  } catch (error) {
    console.error('Napaka pri GET /workorders/:docId:', error);
    return res.status(500).json({ error: 'Napaka pri pridobivanju delovnega naloga.' });
  }
});

// POST /api/workorders          → shrani/upsert nalog (ko klikneš “Pošlji v delo”)
router.post('/', async (req, res) => {
  try {
    const workOrderData = req.body;
    // Uporabi obstoječi mk_id ali generiraj enega
    if (!workOrderData.mk_id) {
      return res.status(400).json({ error: 'mk_id manjka v telesu zahteve.' });
    }

    // Upsert: shrani ali posodobi (z vsemi polji iz req.body)
    const saved = await WorkOrder.findOneAndUpdate(
      { mk_id: workOrderData.mk_id },
      { $set: workOrderData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json(saved);

  } catch (error) {
    console.error('Napaka pri POST /workorders:', error);
    return res.status(500).json({ error: 'Napaka pri shranjevanju delovnega naloga.' });
  }
});
// DELETE /api/workorders/:id → izbriše nalog po _id ali mk_id (če ni najdeno po _id)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Najprej poskusi po Mongo _id
    let deletedOrder = await WorkOrder.findByIdAndDelete(id);

    // Če ni najdeno po _id, poskusi še po mk_id
    if (!deletedOrder) {
      deletedOrder = await WorkOrder.findOneAndDelete({ mk_id: id });
    }

    if (!deletedOrder) {
      return res.status(404).json({ error: "Delovni nalog ni bil najden za izbris." });
    }

    res.json({ message: "Delovni nalog izbrisan.", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
