// src/utils/productSectorMapping.js

// Privzeti mapping: ključ so prve dve številki (kot string) in vrednost je sektor.
const defaultMapping = {
  "01": "Odrez in obdelava stekla",    // 01, 02, 03, 04, 05 spadajo v 2. sektor
  "02": "Odrez in obdelava stekla",
  "03": "Odrez in obdelava stekla",
  "04": "Odrez in obdelava stekla",
  "05": "Odrez in obdelava stekla",
  "06": "Zunanji steklar",              // 06 spada v 1. sektor
  "07": "Kaljenje ali/in lepljenje stekla", // Privzeto za 07; izjeme pa bodo preglasile to
  "08": "Zunanji steklar",              // 08 spada v 1. sektor
  "09": "Odrez in obdelava stekla",     // 09 spada v 2. sektor
  "10": "Zunanji steklar",              // 10 spada v 1. sektor
  "11": "Odrez in obdelava stekla",     // 11 spada v 2. sektor
  "12": "Odrez in obdelava stekla",     // 12 spada v 2. sektor
  "13": "Ostala obdelava stekla",       // 13 spada v 7. sektor
  "14": "Storitev delavnica",           // 14 spada v 10. sektor
  "15": "Odrez in obdelava stekla",     // 15 spada v 2. sektor
  "16": "Storitev delavnica",           // Privzeto za 16; izjeme bodo preglasile
  "17": "Izris in priprava folije",     // Privzeto za 17; izjeme pa bodo preglasile
  "18": "Okovje, okvirji",              // 18 spada v 8. sektor
  "19": "Ostalo",                           // 19 se ne razvrsti (prazno)
  // Šifre 20,21,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39 spadajo v 8. sektor
  "20": "Okovje, okvirji",
  "21": "Okovje, okvirji",
  "23": "Okovje, okvirji",
  "24": "Okovje, okvirji",
  "25": "Okovje, okvirji",
  "26": "Okovje, okvirji",
  "27": "Okovje, okvirji",
  "28": "Okovje, okvirji",
  "29": "Okovje, okvirji",
  "30": "Okovje, okvirji",
  "31": "Okovje, okvirji",
  "32": "Okovje, okvirji",
  "33": "Okovje, okvirji",
  "34": "Okovje, okvirji",
  "35": "Okovje, okvirji",
  "36": "Okovje, okvirji",
  "37": "Okovje, okvirji",
  "38": "Okovje, okvirji",
  "39": "Okovje, okvirji",
  "40": "Odrez in obdelava stekla",    // Privzeto za 40; izjeme bodo preglasile
  "41": "Zunanji steklar",              // 41 spada v 1. sektor
  "42": "Okovje, okvirji",              // Privzeto za 42; izjeme bodo preglasile (če se doda)
  "43": "Okovje, okvirji",              // 43 spada v 8. sektor
  "44": "Okovje, okvirji",              // 44 spada v 8. sektor
  "45": "Zunanji steklar",              // 45 spada v 1. sektor
  "46": "",                           // 46 se ne prikaže
  "47": "",                           // 47 se ne prikaže
  "51": "",                           // 51 se ne prikaže
  "55": "",                           // 55 se ne prikaže
  "48": "Okovje, okvirji",             // 48 spada v 8. sektor
  "49": "Okovje, okvirji",             // 49 spada v 8. sektor
  "52": "Okovje, okvirji",             // 52 spada v 8. sektor
  "53": "Okovje, okvirji",             // 53 spada v 8. sektor
  "54": "Okovje, okvirji"              // 54 spada v 8. sektor
};

// Exceptions mapping: Celotne šifre (brez presledkov, vse velike) za specifične primere
const exceptionsMapping = {
  // Za šifre, ki začnejo s "07" in morajo iti drugam:
  // Če je šifra "07XXXX", kjer so navedene izjeme:
  "0769985": "Zunanji steklar",
  "0769986": "Zunanji steklar",
  "0769986A": "Zunanji steklar",
  "0769986B": "Zunanji steklar",
  "0769987": "Zunanji steklar",
  "0769987A": "Zunanji steklar",
  "0769987B": "Zunanji steklar",
  "0769988": "Ostala obdelava stekla",
  "0769988A": "Ostala obdelava stekla",
  "0769988B": "Ostala obdelava stekla",
  
  // Za šifre, ki začnejo s "16" in morajo iti v druge sektorje:
  // Za "16" gredo v Montažo (11. sektor)
  "1675200": "Ostalo",
  "1675200A": "Ostalo",
  "1675200C": "Ostalo",
  "1675200D": "Ostalo",
  "1675200K": "Ostalo",
  "1675201": "Ostalo",
  "1675202": "Ostalo",
  "1675250": "Ostalo",
  "1675580": "Ostalo",
  "1675801": "Ostalo",
  "1675802": "Ostalo",
  "1675802K": "Ostalo",
  "1675803": "Ostalo",
  "1675804": "Ostalo",
  "1675804A": "Ostalo",
  "1675805": "Ostalo",
  "1675806": "Ostalo",
  "1675806A": "Ostalo",
  "1675810": "Ostalo",
  "1675811": "Ostalo",
  "1675812": "Ostalo",
  // Za "16" gredo v Barvanje profilov/obdelava kovine (9. sektor)
  "1675200B": "Barvanje profilov/obdelava kovine",
  "1675203": "Barvanje profilov/obdelava kovine",
  "1675204": "Barvanje profilov/obdelava kovine",
  "1675205": "Barvanje profilov/obdelava kovine",
  // Za "16" gredo v Lepljenje folije/peskanje (6. sektor)
  "1675310": "Lepljenje folije/peskanje",
  "1675400": "Lepljenje folije/peskanje",
  "1675500": "Lepljenje folije/peskanje",
  "1675520": "Lepljenje folije/peskanje",
  "1675529": "Lepljenje folije/peskanje",
  "1675530": "Lepljenje folije/peskanje",
  "1675540": "Lepljenje folije/peskanje",
  "1675541": "Lepljenje folije/peskanje",
  "1675549": "Lepljenje folije/peskanje",
  "1675550": "Lepljenje folije/peskanje",
  "1675570": "Lepljenje folije/peskanje",
  // Za "16" gredo v Premaz stekla (4. sektor)
  "1675700A": "Premaz stekla",
  
  // Za "17" izjeme: Če je šifra "17XXXX" in mora iti v Lepljenje folije/peskanje (6. sektor)
  "1771300": "Lepljenje folije/peskanje",
  "1771301": "Lepljenje folije/peskanje",
  
  // Za "40" izjeme: Če je šifra "40XXXX" in mora iti v Storitev delavnica (10. sektor)
  "4010004": "Storitev delavnica",
  "4010005": "Storitev delavnica",
  "4010006": "Storitev delavnica",
  "4010007": "Storitev delavnica",
  
  // Za "42" izjeme: Če je šifra "42XXXX" in se ne prikaže (vrne prazen niz)
  "42000100": "",
  "42000101": "",
  "42000103": "",
  "4290085A": "",
  "4295001": "",
  "4295002": "",
  "4295003": "",
  "4295004": "",
  "4295005": "",
  "4295006": "",
  "4295011": "",
  "4295012": "",
  "4295013": "",
  "4295014": "",
  "4295015": "",
  "4295016": "",
  "42VZOREC": "",
  "42VZOREC1": "",
  "42VZOREC2": "",
  "42VZOREC3": "",
  "42VZORECKNJIGA": "",
  "42VZORECOGLEDALA": ""
  // Dodaj še dodatne izjeme, če je potrebno.
};

const productSectorMapping = (productCode) => {
  if (!productCode) return "Ostala obdelava stekla";

  // Odstrani presledke in pretvori v velike črke
  const cleanedCode = productCode.replace(/\s/g, "").toUpperCase();

  // Preveri, če je koda navedena v exceptionsMapping
  if (exceptionsMapping.hasOwnProperty(cleanedCode)) {
    return exceptionsMapping[cleanedCode];
  }

  // Če ni izjeme, uporabi prvii dve številki iz koda in poišči sektor v defaultMapping
  const prefix = cleanedCode.substring(0, 2);
  return defaultMapping[prefix] || "Ostala obdelava stekla";
};

export default productSectorMapping;
