// backend/utils/getSector.js
const productSectorMapping = require("./productSectorMapping.js");

const getSectorFromProductCode = (productCode) => {
  return productSectorMapping(productCode);
};

module.exports = getSectorFromProductCode;
