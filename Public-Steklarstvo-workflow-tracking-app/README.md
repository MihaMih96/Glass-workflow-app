# Aplikacija za sledenje proizvodnje v steklarstvu

To je spletna aplikacija, razvita za interno sledenje delovnim nalogom v podjetju Steklarstvo Kresal.  
Sistem omogoča pregled, obdelavo in nadzor nad fazami proizvodnje stekla: od razreza do montaže.

## 💡 Funkcionalnosti
- Uvoz delovnih nalogov preko API-ja (Metakocka)
- Samodejna določitev sektorja glede na kodo izdelka
- Sledenje statusom v realnem času
- Pregledna delavnica in montažna stran
- Modularna arhitektura z backendom in frontendom

## 🔧 Tehnologije
- **Backend**: Node.js + Express
- **Baza**: MongoDB + Mongoose
- **Frontend**: React + Redux Toolkit
- Dodatno: Axios, dotenv, uuid, bcrypt, jsonwebtoken

## 📁 Struktura mape
- `routes/` – API poti
- `models/` – MongoDB modeli (Mongoose)
- `services/` – povezave z API-ji (npr. Metakocka)
- `utils/` – pomožne funkcije (npr. dodeljevanje sektorjev)
- `frontend/` – React aplikacija (ločen modul)


## 📣 Namen
Projekt je bil razvit za interno optimizacijo delovnih procesov, nadzor nad proizvodnjo in digitalizacijo v steklarstvu.