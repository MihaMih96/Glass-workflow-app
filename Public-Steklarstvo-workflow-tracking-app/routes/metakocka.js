// routes/metakocka.js
const express = require('express');
const router = express.Router();

const { fetchWorkOrder } = require('../services/metakockaService');
const WorkOrder = require('../models/WorkOrder');

// Pomožna funkcija za varno pretvorbo datuma – vzame samo prvih 10 znakov in ustvari Date v lokalnem času
function parseDate(dateStr) {
  if (!dateStr) return null;
  // Vzemi prvih 10 znakov (YYYY-MM-DD)
  const datePart = dateStr.substring(0, 10);
  const [year, month, day] = datePart.split("-");
  // Ustvari datum v lokalnem času (month je 0-indeksiran)
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
}

// Funkcija, ki iz Date objekta vrne niz v formatu "YYYY-MM-DD"
function formatDateToString(date) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Preslikaj elemente v work_plan_list
function mapWorkPlanList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    const originalWhen = item.when;
    const mappedWhen = originalWhen ? parseDate(originalWhen) : null;
    if (!mappedWhen && originalWhen) {
      console.error("[ERROR] Neveljaven datum v work_plan_list, when:", originalWhen);
    }
    return {
      ...item,
      when: mappedWhen
    };
  });
}

// Preslikaj elemente v create_product_realization_list
function mapProductRealizationList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    const originalWhen = item.when;
    const mappedWhen = originalWhen ? parseDate(originalWhen) : null;
    if (!mappedWhen && originalWhen) {
      console.error("[ERROR] Neveljaven datum v product realization item, when:", originalWhen);
    }
    const mappedWorkPlanList = item.work_plan_list ? mapWorkPlanList(item.work_plan_list) : [];
    return {
      ...item,
      when: mappedWhen,
      work_plan_list: mappedWorkPlanList
    };
  });
}

// Preslikaj elemente v material_plan_list
function mapMaterialPlanList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    const originalWhen = item.when;
    const mappedWhen = originalWhen ? parseDate(originalWhen) : null;
    if (!mappedWhen && originalWhen) {
      console.error("[ERROR] Neveljaven datum v material_plan_list, when:", originalWhen);
    }
    return {
      ...item,
      when: mappedWhen
    };
  });
}

router.get('/workorder/:docId', async (req, res) => {
  try {
    const docId = req.params.docId;
    console.log(`[DEBUG] Prejemam zahtevo za workorder z docId: ${docId}`);

    const data = await fetchWorkOrder(docId);
    console.log("[DEBUG] Prejeti podatki iz Metakocke:", data);

    const mappedData = {
      mk_id: data.mk_id || docId,
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
      // Za produce_deadline_date pretvori in nato formatiraj v niz "YYYY-MM-DD"
      produce_deadline_date: data.produce_deadline_date
        ? formatDateToString(parseDate(data.produce_deadline_date))
        : null,
      caretaker_list: data.caretaker_list || [],
      sum_sales_plan: data.sum_sales_plan,
      create_product_realization_list: mapProductRealizationList(data.create_product_realization_list),
      material_plan_list: mapMaterialPlanList(data.material_plan_list),
      completed: data.completed || [],
      path: data.path || []
    };
    console.log("[DEBUG] Preslikani podatki:", mappedData);

    const workorder = await WorkOrder.findOneAndUpdate(
      { mk_id: docId },
      { $set: mappedData, $unset: { docId: "" } },
      { new: true, upsert: true }
    );
    console.log("[DEBUG] Shranjeni workorder:", workorder);

    res.json(workorder);
  } catch (error) {
    console.error("[ERROR] Napaka v /workorder endpointu:", error);
    if (error.response) {
      console.error("[ERROR] Podatki iz napake API-ja:", error.response.data);
      console.error("[ERROR] Statusna koda:", error.response.status);
    }
    res.status(500).json({ error: 'Napaka pri pridobivanju podatkov iz Metakocke.' });
  }
});

module.exports = router;
