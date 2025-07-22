// backend/utils/processWorkOrderData.js
const { v4: uuidv4 } = require('uuid');
const getSectorFromProductCode = require('./getSector');

function processWorkOrderData(workOrderData) {
  if (Array.isArray(workOrderData.create_product_realization_list)) {
    workOrderData.create_product_realization_list = workOrderData.create_product_realization_list.map((item, index) => {
      // Generiraj cellId samo, če ni podan ali je prazen
      if (!item.cellId || item.cellId.trim() === "") {
        item.cellId = `${workOrderData.mk_id}-${item.product_code || index}-${uuidv4().slice(0, 8)}`;
      }
      
      // Dodeli sektor na podlagi product_code, če ni podan
      if (!item.sector) {
        item.sector = getSectorFromProductCode(item.product_code);
      }
      
      // Nastavi privzete vrednosti za nova polja, če niso definirana
      if (typeof item.finished === 'undefined') {
        item.finished = false;
      }
      if (typeof item.ordered === 'undefined') {
        item.ordered = false;
      }
      if (typeof item.received === 'undefined') {
        item.received = false;
      }
      if (typeof item.noteProvided === 'undefined') {
        item.noteProvided = false;
      }
      if (typeof item.noteText === 'undefined') {
        item.noteText = "";
      }
      if (typeof item.lastModified === 'undefined') {
        item.lastModified = "";
      }
      
      return item;
    });
  }
  return workOrderData;
}

module.exports = processWorkOrderData;
