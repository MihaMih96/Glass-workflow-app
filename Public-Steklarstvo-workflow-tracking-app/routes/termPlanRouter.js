const express = require('express');
const router = express.Router();
const TermPlan = require('../models/TermPlan');
// Funkcija, ki preveri ali je lock star več kot 15 minut in če ja, shrani neshranjene podatke in unlocka
async function checkAndAutoSaveLock(termPlan) {
  if (!termPlan.lock) return false;
  const now = Date.now();
  if (now - termPlan.lock.timestamp > 15 * 60 * 1000) {
    // Če obstajajo pending podatki jih shrani!
    if (termPlan.lock.unsavedData) {
      termPlan.gridData = termPlan.lock.unsavedData.gridData;
      termPlan.dayNotes = termPlan.lock.unsavedData.dayNotes;
    }
    termPlan.lock = null;
    await termPlan.save();
    return true;
  }
  return false;
}

// GET endpoint: pridobi terminski plan za določen teden (vključno z dayNotes)
router.get('/:weekKey', async (req, res) => {
  try {
    let termPlan = await TermPlan.findOne({ weekKey: req.params.weekKey });
    if (termPlan) {
      await checkAndAutoSaveLock(termPlan); // Dodano
      termPlan = await TermPlan.findOne({ weekKey: req.params.weekKey }); // Ponovno preberi
      res.json({
        gridData: termPlan.gridData,
        dayNotes: termPlan.dayNotes,
        lock: termPlan.lock || null
      });
    } else {
      res.json({ gridData: [], dayNotes: Array(5).fill(""), lock: null });
    }
  } catch (err) {
    res.status(500).json({ error: "Napaka pri pridobivanju terminskega plana." });
  }
});

router.post('/:weekKey/refreshLock', async (req, res) => {
  const { username, unsavedData } = req.body;
  try {
    const termPlan = await TermPlan.findOne({ weekKey: req.params.weekKey });
    if (!termPlan) return res.status(404).json({ error: "Ne najdem terminskega plana." });
    if (termPlan.lock && termPlan.lock.username === username) {
      termPlan.lock.timestamp = Date.now();
      if (unsavedData) termPlan.lock.unsavedData = unsavedData;
      await termPlan.save();
      return res.json({ lock: termPlan.lock });
    } else {
      return res.status(403).json({ error: "Nimaš več zaklepa!" });
    }
  } catch (err) {
    res.status(500).json({ error: "Napaka pri refresh lock", details: err.message });
  }
});

// POST endpoint: shrani/posodobi terminski plan za določen teden (vključno z dayNotes)
router.post('/', async (req, res) => {
  try {
    const { weekKey, gridData, dayNotes } = req.body;
    const termPlan = await TermPlan.findOneAndUpdate(
      { weekKey },
      { $set: { gridData, dayNotes } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    // Pretvori Mongoose dokument v običajen objekt, da zagotovimo pravilno serializacijo
    res.status(200).json(termPlan.toObject());
  } catch (err) {
    console.error("Napaka pri shranjevanju terminskega plana:", err);
    res.status(500).json({ error: "Napaka pri shranjevanju terminskega plana." });
  }
});

// Zakleni terminski plan
router.post('/:weekKey/lock', async (req, res) => {
  const { username, force } = req.body;
  try {
const termPlan = await TermPlan.findOne({ weekKey: req.params.weekKey }); if (!termPlan) return res.status(404).json({ error: 'Ne najdem terminskega plana.' }); await checkAndAutoSaveLock(termPlan); // Dodano!

    // Če je že zaklenjen od drugega userja in force NI true
    if (termPlan.lock && termPlan.lock.username && termPlan.lock.username !== username && !force) {
      return res.status(403).json({ error: 'Plan je že zaklenjen od drugega uporabnika!', lock: termPlan.lock });
    }

    // Če ni locka, ali je force (ali tvoj user), nastavi novega
    termPlan.lock = { username, timestamp: Date.now() };
    await termPlan.save();
    return res.json({ lock: termPlan.lock });
  } catch (err) {
    res.status(500).json({ error: 'Napaka pri zaklepanju', details: err.message });
  }
});

// Odkleni terminski plan
router.post('/:weekKey/unlock', async (req, res) => {
  const { username } = req.body;
  try {
    const termPlan = await TermPlan.findOne({ weekKey: req.params.weekKey });
    if (!termPlan) return res.status(404).json({ error: 'Ne najdem terminskega plana.' });

    // Lahko unlocka samo tisti, ki je zaklenil!
    if (!termPlan.lock || termPlan.lock.username !== username) {
      return res.status(403).json({ error: 'Ne moreš odkleniti plana, ki ga nisi zaklenil!' });
    }

    termPlan.lock = null;
    await termPlan.save();
    return res.json({ lock: null });
  } catch (err) {
    res.status(500).json({ error: 'Napaka pri odklepanju', details: err.message });
  }
});

module.exports = router;
