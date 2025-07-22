import { v4 as uuidv4 } from "uuid";
import getSectorFromProductCode from "./getSector";

const processWorkOrderData = (data) => {
  if (!data.create_product_realization_list) return data;
  
  // Uporabi data.mk_id, če obstaja, sicer pa data.id ali data._id
  const orderId = data.mk_id || data.id || data._id;
  console.log("Processing work order. Order ID:", orderId);
  
  const updatedList = data.create_product_realization_list.map((item, index) => {
    // Generiraj edinstven cellId samo, če ni podan ali je prazen
    const cellId =
      !item.cellId || item.cellId.trim() === ""
        ? `${orderId}-${item.product_code || index}-${uuidv4().slice(0, 8)}`
        : item.cellId;
    console.log(`Artikel ${index}: product_code=${item.product_code}, cellId=${cellId}`);
    return {
      ...item,
      sector: getSectorFromProductCode(item.product_code),
      cellId: cellId
    };
  });
  
  const sectors = [...new Set(updatedList.map(item => item.sector))];
  
  return { 
    ...data, 
    confirmedDate: data.confirmedDate, // Eksplicitno vključimo datum potrditve, če obstaja
    path: data.path || sectors,
    completed: data.completed || [],
    create_product_realization_list: updatedList,
    workshopCompleted: false // Naloga še ni zaključena v Workshopu
  };
};

export default processWorkOrderData;
