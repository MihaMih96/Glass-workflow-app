// src/utils/getSector.js
import productSectorMapping from "./productSectorMapping";

const getSectorFromProductCode = (productCode) => {
  return productSectorMapping(productCode);
};

export default getSectorFromProductCode;
