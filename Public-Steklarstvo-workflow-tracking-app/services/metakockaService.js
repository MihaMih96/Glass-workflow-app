// services/metakockaService.js
const axios = require('axios');

/**
 * Kliče Metakockin API za pridobitev delovnega naloga.
 * @param {string} docId - ID dokumenta (delovnega naloga), ki ga želiš pridobiti.
 * @returns {Object} JSON, ki ga vrne Metakocka.
 */
async function fetchWorkOrder(docId) {
  try {
    // Pripravi payload natanko tako, kot si ga uporabil v Postmanu.
    const payload = {
      secret_key: process.env.METAKOCKA_SECRET_KEY,
      company_id: process.env.METAKOCKA_COMPANY_ID,
      doc_type: process.env.METAKOCKA_DOC_TYPE,
      doc_id: docId
    };

    console.log("[DEBUG] Pošiljam payload:", payload);

    // Pošlješ POST zahtevek na Metakockin API URL (definiran v .env)
    const response = await axios.post(process.env.METAKOCKA_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("[DEBUG] Prejeti odgovor iz Metakocke:", response.data);

    // Če ni napake, vrneš podatke, ki jih dobiš v response.data
    return response.data;
  } catch (error) {
    console.error("[ERROR] Napaka pri pridobivanju dokumenta iz Metakocke:", error.message);
    if (error.response) {
      console.error("[ERROR] Response data:", error.response.data);
      console.error("[ERROR] Response status:", error.response.status);
    }
    throw error; // vržemo napako naprej, da jo ujamejo višji sloji (rute)
  }
}

module.exports = {
  fetchWorkOrder
};
