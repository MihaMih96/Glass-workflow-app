// src/pages/TerminskiPlan.js
import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaSearch,
  FaCopy,
  FaTrash,
  FaPaste,
  FaTimes
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { updateWorkOrderThunk, getAllWorkOrders } from "../store/workOrdersSlice";
import {
  setGridData,
  setCurrentWeekKey,
  getTermPlan,
  updateTermPlan
} from "../store/termPlanSlice";
import api from "../services/api"; // <-- Za Axios instanco in klice na backend
import { getCurrentUsername } from "../utils/auth";
import "./TerminskiPlan.css";


// Komponenta za urejanje inputa, ki ohranja fokus in lokalno vrednost
const EditableInput = React.memo(
  ({ initialValue, onCommit, autoFocus = false, placeholder = "", className = "", disabled = false }) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    const handleBlur = () => {
      onCommit(value);
    };
        if (disabled) {
      return <span className={className}>{initialValue}</span>;
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBlur();
          }
        }}
      />
    );
  }
);



// Nova komponenta za urejanje textarea, deluje kot EditableInput
const EditableTextArea = React.memo(
  ({ initialValue, onCommit, autoFocus = false, placeholder = "", className = "", disabled = false }) => {
    const [value, setValue] = useState(initialValue);
    const textAreaRef = useRef(null);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      if (autoFocus && textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }, [autoFocus]);

    const handleBlur = () => {
      onCommit(value);
    };
        if (disabled) {
      return <span className={className}>{initialValue}</span>;
    }

    return (
      <textarea
        ref={textAreaRef}
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      />
    );
  }
);

// 5 delovnih dni v tednu
const dayNames = ["PON", "TOR", "SRE", "ČET", "PET"];

// Opcije za select polja
const workTypeOptions = ["Montaža", "Izmera", "Dostava", "Prevzem materiala"];
const workerOptions = ["Sandi", "Robert", "Miro R.", "Miro T.", "Igor", "Robi M.", "Dean", "Bojan", "Andrej", "Tomaž"];
const enteredByOptions = ["Sandi", "Robert", "Sara", "Polona", "Barbara"];

// Fiksno število vrstic (prve 2 ne moremo izbrisati)
const initialRowCount = 2;

function generateTimeOptions() {
  const times = [];
  for (let minutes = 420; minutes <= 960; minutes += 10) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    times.push(`${hh}:${mm}`);
  }
  return times;
}

/**
 * Ustvari prazno vrstico za tabelo.
 */
function createEmptyRow(index) {
  return {
    jobNumber: Array.from({ length: dayNames.length }, () => ""),
    clientName: Array.from({ length: dayNames.length }, () => ""),
    time: Array.from({ length: dayNames.length }, () => "00:00"),
    workType: Array.from({ length: dayNames.length }, () => "Montaža"),
    locationAddress: Array.from({ length: dayNames.length }, () => ""),
    status: Array.from({ length: dayNames.length }, () => "default"),
    worker: Array.from({ length: dayNames.length }, () => []),
    enteredBy: Array.from({ length: dayNames.length }, () => ""),
    date: Array.from({ length: dayNames.length }, () => ""),
    orderId: Array.from({ length: dayNames.length }, () => "")
  };
}

const initialRows = Array.from({ length: initialRowCount }, (_, i) =>
  createEmptyRow(i)
);

// Vrne datum ponedeljka za dani datum
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

function getWeekDates(currentMonday) {
  const result = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + i);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    result.push(`${dayNames[i]} ${day}.${month}`);
  }
  return result;
}

function getRangeString(currentMonday) {
  const startDay = currentMonday.getDate();
  const startMonth = currentMonday.getMonth() + 1;
  const endDate = new Date(currentMonday);
  endDate.setDate(endDate.getDate() + 4);
  const endDay = endDate.getDate();
  const endMonth = endDate.getMonth() + 1;
  return `${startDay}.${startMonth} - ${endDay}.${endMonth}`;
}

const formatDate = (dateStr) => {
  if (!dateStr) return "Ni podatka";
  if (!dateStr.includes("T") && dateStr.length >= 10) {
    const [year, month, day] = dateStr.substring(0, 10).split("-");
    return `${day}.${month}.${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("sl-SI");
};

const getAddress = (partner) => {
  if (!partner) return "Ni podatka";
  const street = partner.street || "";
  const postNumber = partner.post_number || "";
  const place = partner.place || "";
  const country = partner.country || "";
  let address = "";
  if (street) address += street;
  if (postNumber) address += street ? `, ${postNumber}` : postNumber;
  if (place) address += postNumber ? ` ${place}` : (address ? `, ${place}` : place);
  if (country) address += address ? `, ${country}` : country;
  return address;
};

const getStatusClass = (status) => {
  switch (status) {
    case "pripravljeno":
      return "status-pripravljeno";
    case "opcijsko":
      return "status-opcijsko";
    case "izmera":
      return "status-izmera";
    default:
      return "";
  }
};

function getOrderBoxClass(order) {
  if (order.dostava) return "delivery-box";
  // montaža ostane privzeto (oranžna)
  return "";
}

function TerminskiPlan() {
  const dispatch = useDispatch();
  // --- LOCKING STANJE ---
// TODO: username vzemi iz Auth ali za test hardcodiraj
  const username = getCurrentUsername();
  const [locking, setLocking] = useState(false);
  const timeOptions = generateTimeOptions();
    const handleFullSaveAndUnlock = async () => {
    await dispatch(updateTermPlan({ weekKey: currentWeekKey, gridData, dayNotes }));
      localStorage.removeItem("termPlanBackup"); // počisti backup
  localStorage.removeItem("termPlanDraft");  // počisti draft
    unlockPlan();
  };
// Nič več kode spodaj! Samo naslednja funkcija ali logika sledi naprej.

  // Filtriramo naročila za montažo in dostavo
const workOrders = useSelector((state) =>
  state.workOrders.orders.filter(
    (order) =>
      (order.montaza || order.dostava) && // <-- ključna sprememba
      order.ready === "Zaključeno" &&
      !order.dropped
  )
);
  const [lock, setLock] = useState(null);      // Trenutni lock objekt (ali null)
  const [lockError, setLockError] = useState("");
  const isEditable = !!lock && lock.username === username;

  const currentWeekKey = useSelector((state) => state.termPlan.currentWeekKey);
  // Preberemo terminski plan iz Redux state; če so shranjeni podatki stari (samo gridData kot array),
  // uporabimo privzete beležke, sicer razčlenimo objekt.
  const termPlanData = useSelector((state) => state.termPlan.weeks[currentWeekKey]);
  let gridData, serverDayNotes;
  if (Array.isArray(termPlanData)) {
    gridData = termPlanData;
    serverDayNotes = Array(dayNames.length).fill("");
  } else {
    gridData = termPlanData && termPlanData.gridData ? termPlanData.gridData : initialRows;
    serverDayNotes =
      termPlanData && termPlanData.dayNotes && termPlanData.dayNotes.length === dayNames.length
        ? termPlanData.dayNotes
        : Array(dayNames.length).fill("");
  }

  // Lokalno stanje za beležke
  const [dayNotes, setDayNotes] = useState(Array(dayNames.length).fill(""));

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [clipboard, setClipboard] = useState(null);
  const [editingCell, setEditingCell] = useState({ row: null, col: null });
  const [dirty, setDirty] = useState(false);
  const [showSentOnly, setShowSentOnly] = useState(false);

    // Restore backup iz localStorage, če obstaja, ob mountu ali spremembi tedna/uporabnika
  useEffect(() => {
    // Preberi lokalni backup (če obstaja)
    const backupRaw = localStorage.getItem("termPlanBackup");
    if (backupRaw) {
      try {
        const backup = JSON.parse(backupRaw);
        // Preveri če je za pravi teden, pravi username, in ima podatke
        if (
          backup.weekKey === currentWeekKey &&
          backup.username === username &&
          backup.gridData &&
          backup.dayNotes
        ) {
          // Prepiši podatke v store (obnovi lokalno)
          dispatch(setGridData({ gridData: backup.gridData, dayNotes: backup.dayNotes }));
        }
      } catch (e) {
        // Ignore napako (lahko je pokvarjen JSON)
      }
    }
    // eslint-disable-next-line
  }, [currentWeekKey, username, dispatch]);


  // Funkcija za zaklepanje
const lockPlan = async (force = false) => {
  setLockError("");
  setLocking(true);
  try {
    const res = await api.post(`/api/termplans/${currentWeekKey}/lock`, { username, force });
    setLock(res.data.lock); // Če si TI zaklenil, shrani lock
  } catch (err) {
    // <-- TUKAJ DODAJ!
    if (err.response?.data?.lock) {
      setLock(err.response.data.lock); // Če ni uspelo, še vedno shrani kdo je lastnik locka!
    } else {
      setLock(null);
    }
    setLockError(err.response?.data?.error || "Napaka pri zaklepanju.");
  } finally {
    setLocking(false);
  }
};
console.log("Aktivni username:", username);
console.log("LOCK objekt:", lock);


// Funkcija za odklepanje
const unlockPlan = async () => {
  setLockError("");
  setLocking(true);
  try {
await api.post(`/api/termplans/${currentWeekKey}/unlock`, { username });
setLock(null);
  } catch (err) {
    setLockError(err.response?.data?.error || "Napaka pri odklepanju.");
  } finally {
    setLocking(false);
  }
};
  // Funkcija za podaljšanje locka (ping lock)
const pingLock = React.useCallback(async () => {
  if (!isEditable) return;
  try {
    const unsavedData = dirty ? { gridData, dayNotes } : null;
    await api.post(`/api/termplans/${currentWeekKey}/refreshLock`, {
      username,
      unsavedData,
    });
  } catch (err) {
    // Napako lahko ignoriraš ali logiraš
  }
}, [isEditable, dirty, gridData, dayNotes, currentWeekKey, username]);


  // Sinhroniziraj beležke s strežnikovimi podatki ob vsaki spremembi
  useEffect(() => {
    setDayNotes(serverDayNotes);
  }, [serverDayNotes]);

  // Nastavi currentWeekKey ob spremembi currentMonday
  useEffect(() => {
    const mondayKey = currentMonday.toISOString().split("T")[0];
    dispatch(setCurrentWeekKey(mondayKey));
  }, [currentMonday, dispatch]);

  useEffect(() => {
  if (!isEditable) return; // Samo če imaš zaklep (urejaš)
  const handleBeforeUnload = (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = ""; // Chrome zahteva to vrstico za prikaz opozorila
    }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [dirty, isEditable]);

  // Ob spremembi currentWeekKey naloži terminski plan iz baze
  useEffect(() => {
    if (currentWeekKey) {
      dispatch(getTermPlan(currentWeekKey));
    }
  }, [currentWeekKey, dispatch]);

  // Ob zagonu strani osveži delovna naročila
  useEffect(() => {
    dispatch(getAllWorkOrders());
  }, [dispatch]);

useEffect(() => {
  // Polling samo, če imaš currentWeekKey
  if (!currentWeekKey) return;

  // Poll funkcija: preberi lock iz API-ja
const pollLock = async () => {
  try {
    const res = await api.get(`/api/termplans/${currentWeekKey}`);
    if (res.data && res.data.lock) {
      setLock(res.data.lock);
      // Če nisi več ti lastnik locka, opozori
      if (res.data.lock.username !== username && isEditable) {
        setLockError("Urejanje je prevzel drug uporabnik!");
      }
    } else {
      setLock(null);
    }

    // ---- Dodano: OSVEŽI TABELARIČNE PODATKE ----
    // Osveži samo če uporabnik NE ureja (torej ni locka ali nisi ti lastnik)
    if (!isEditable) {
      // Tu res.data.gridData in res.data.dayNotes
      if (res.data && (res.data.gridData || res.data.dayNotes)) {
        dispatch(setGridData({
          gridData: res.data.gridData || [],
          dayNotes: res.data.dayNotes || Array(dayNames.length).fill("")
        }));
      }
    }
    // Če si lastnik locka, nikoli ne prepiši lokalnih sprememb!
  } catch (err) {
    // Lahko ignoriraš error, ali pokažeš sporočilo
  }
};


  // Zaženi vsakih 5 sekund
  const interval = setInterval(pollLock, 5000);

  // Počisti na unmount ali spremembo tedna
  return () => clearInterval(interval);
  // eslint-disable-next-line
}, [currentWeekKey, username, isEditable]);
// Avtomatski ping locka vsakih 60 sekund, če je uporabnik urejevalec (lock.username === username)
useEffect(() => {
  if (!isEditable) return;
  const interval = setInterval(() => {
    pingLock();
  }, 60 * 1000);
  return () => clearInterval(interval);
}, [isEditable, pingLock]);



useEffect(() => {
  if (!isEditable) return;
  if (!dirty) return;
  const timeout = setTimeout(() => {
    dispatch(updateTermPlan({ weekKey: currentWeekKey, gridData, dayNotes }));
    setDirty(false);
        localStorage.removeItem("termPlanBackup"); // <-- dodaj to sem!
    localStorage.removeItem("termPlanDraft");
  }, 30000); // 20 sekund
  return () => clearTimeout(timeout);
}, [isEditable, dirty, gridData, dayNotes, currentWeekKey, dispatch]);

// Auto-backup vsake spremembe v localStorage
useEffect(() => {
  if (!isEditable) return;
  // Shrani vsakokrat, ko se spremeni gridData ali dayNotes
  const backup = {
    gridData,
    dayNotes,
    lastModified: Date.now(),
    weekKey: currentWeekKey,
    username,
  };
  localStorage.setItem("termPlanBackup", JSON.stringify(backup));
}, [isEditable, gridData, dayNotes, currentWeekKey, username]);


// Shrani v localStorage ob vsaki spremembi (če imaš lock in je kaj spremenjeno)
useEffect(() => {
  if (isEditable && dirty) {
    const backup = {
      gridData,
      dayNotes,
      currentWeekKey,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("termPlanDraft", JSON.stringify(backup));
  }
}, [gridData, dayNotes, isEditable, dirty, currentWeekKey]);


  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
  };

  const updateRowFields = (rowIndex, colIndex, updates) => {
    const updatedGrid = gridData.map((row, i) => {
      if (i === rowIndex) {
        const updatedRow = { ...row };
        Object.keys(updates).forEach((field) => {
          if (Array.isArray(row[field])) {
            updatedRow[field] = row[field].map((val, j) =>
              j === colIndex ? updates[field] : val
            );
          }
        });
        return updatedRow;
      }
      return row;
    });
    dispatch(setGridData({ gridData: updatedGrid, dayNotes }));
    setDirty(true);
  };

  const handleDrop = (rowIndex, colIndex, e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("text/plain");
    try {
      const boxData = JSON.parse(dataStr);
      if (!boxData.id) return;
      const cellDate = new Date(currentMonday);
      cellDate.setDate(cellDate.getDate() + colIndex);
      updateRowFields(rowIndex, colIndex, {
        jobNumber: boxData.jobNumber,
        clientName: boxData.clientName,
        locationAddress: boxData.locationAddress,
        date: cellDate.toISOString(),
        orderId: boxData.id
      });
      dispatch(updateWorkOrderThunk({ _id: boxData.id, dropped: true }));
    } catch (err) {
      console.error("Napaka pri branju drag data:", err);
    }
  };

  const addRow = () => {
    const newRow = createEmptyRow(gridData.length);
    const updatedGrid = [...gridData, newRow];
    dispatch(setGridData({ gridData: updatedGrid, dayNotes }));
    setDirty(true);
  };

  const deleteLastRow = () => {
    if (gridData.length > 2) {
      const updatedGrid = gridData.slice(0, gridData.length - 1);
      dispatch(setGridData({ gridData: updatedGrid, dayNotes }));
      setDirty(true);
    }
  };

  const goPrevWeek = () => {
    setCurrentMonday((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goNextWeek = () => {
    setCurrentMonday((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const handleCopy = (rowIndex, colIndex) => {
    const cellData = {
      jobNumber: gridData[rowIndex].jobNumber[colIndex],
      clientName: gridData[rowIndex].clientName[colIndex],
      locationAddress: gridData[rowIndex].locationAddress[colIndex]
    };
    setClipboard(cellData);
  };

  const handleClear = (rowIndex, colIndex) => {
    if (
      gridData[rowIndex] &&
      gridData[rowIndex].orderId &&
      gridData[rowIndex].orderId[colIndex]
    ) {
      const cellOrderId = gridData[rowIndex].orderId[colIndex];
      dispatch(updateWorkOrderThunk({ _id: cellOrderId, dropped: false }));
    }
    updateRowFields(rowIndex, colIndex, {
      jobNumber: "",
      clientName: "",
      locationAddress: "",
      date: "",
      orderId: ""
    });
  };

  const handlePaste = (rowIndex, colIndex) => {
    if (clipboard) {
      updateRowFields(rowIndex, colIndex, {
        jobNumber: clipboard.jobNumber,
        clientName: clipboard.clientName,
        locationAddress: clipboard.locationAddress
      });
    }
  };

  const removeWorker = (rowIndex, colIndex, workerIndex) => {
    const updatedGrid = gridData.map((row, i) => {
      if (i === rowIndex) {
        return {
          ...row,
          worker: row.worker.map((cell, j) =>
            j === colIndex ? cell.filter((_, idx) => idx !== workerIndex) : cell
          )
        };
      }
      return row;
    });
    dispatch(setGridData({ gridData: updatedGrid, dayNotes }));
    setDirty(true);
  };

  const renderGridItem = (rowIndex, colIndex) => {
    // Prva vrstica: glava z dnevom in datumom
    if (rowIndex === 0) {
      return (
        <div className="day-header" key={`header-${colIndex}`}>
          {getWeekDates(currentMonday)[colIndex]}
        </div>
      );
    }
    // Druga vrstica: EditableTextArea za beležke
    if (rowIndex === 1) {
      return (
        <div className="day-textarea-container" key={`notes-${colIndex}`}>
          <EditableTextArea
            initialValue={dayNotes[colIndex] || ""}
            placeholder="Vnesi tekst..."
            className="header-input"
            onCommit={(newVal) => {
              const updated = [...dayNotes];
              updated[colIndex] = newVal;
              setDayNotes(updated);
              setDirty(true);
              // Takoj ob izgubi fokusa posreduj spremembo na strežnik
            }}
            disabled={!isEditable}
          />
        </div>
      );
    }
    // Od tretje vrstice naprej: podatki celice
    const actualRow = rowIndex - 2;
    const rowData = gridData[actualRow];
    const cellData = {
      jobNumber: rowData.jobNumber[colIndex],
      clientName: rowData.clientName[colIndex],
      locationAddress: rowData.locationAddress[colIndex],
      status: rowData.status[colIndex],
      time: rowData.time[colIndex],
      workType: rowData.workType[colIndex],
      worker: rowData.worker[colIndex],
      enteredBy: rowData.enteredBy[colIndex],
      date: rowData.date[colIndex],
      orderId: rowData.orderId[colIndex]
    };

    const isFilled =
      cellData.jobNumber !== "" ||
      cellData.clientName !== "" ||
      cellData.locationAddress !== "" ||
      cellData.status !== "default" ||
      cellData.time !== "00:00" ||
      cellData.workType !== "Montaža" ||
      (Array.isArray(cellData.worker) && cellData.worker.length > 0) ||
      cellData.enteredBy !== "" ||
      cellData.date !== "" ||
      cellData.orderId !== "";

    const isMatch =
      appliedSearchTerm &&
      (cellData.clientName.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
        cellData.locationAddress.toLowerCase().includes(appliedSearchTerm.toLowerCase()));

    const statusClass = getStatusClass(cellData.status);
    const cardClasses = `time-card ${isMatch ? "highlight" : ""} ${isFilled ? "filled" : ""}`;

    return (
      <div
  className={cardClasses}
  key={`cell-${rowIndex}-${colIndex}`}
  onDragOver={isEditable ? (e) => e.preventDefault() : undefined}
  onDrop={isEditable ? (e) => handleDrop(actualRow, colIndex, e) : undefined}
>
        <div className="top-section">
          <div className="top-left">
            <EditableInput
              initialValue={cellData.jobNumber}
              onCommit={(newVal) =>
                updateRowFields(actualRow, colIndex, { jobNumber: newVal })
              }
              autoFocus={false}
              className="editable-input"
              disabled={!isEditable}
            />
          </div>
          <div className="top-right">
            <select
              value={cellData.time}
              onChange={(e) =>
                updateRowFields(actualRow, colIndex, { time: e.target.value })
              }
              disabled={!isEditable}
            >
              <option value="00:00">00:00</option>
              {timeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={`row1 status-container ${statusClass}`}>
          <div className="client-name-container">
            <EditableInput
              initialValue={cellData.clientName}
              onCommit={(newVal) =>
                updateRowFields(actualRow, colIndex, { clientName: newVal })
              }
              autoFocus={false}
              className="editable-input"
              disabled={!isEditable}
            />
          </div>
          <select
            value={cellData.status}
            onChange={(e) =>
              updateRowFields(actualRow, colIndex, { status: e.target.value })
            }
            className="status-select"
            disabled={!isEditable}
          >
            <option value="default"></option>
            <option value="pripravljeno">Pripravljeno</option>
            <option value="opcijsko">Opcijsko</option>
            <option value="izmera">Izmera</option>
          </select>
        </div>
        <div className="row2">
          <select
            value={cellData.workType}
            onChange={(e) =>
              updateRowFields(actualRow, colIndex, { workType: e.target.value })
            }
            disabled={!isEditable}
          >
            {workTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="row3">
          {editingCell.row === actualRow && editingCell.col === colIndex ? (
            <EditableInput
              initialValue={cellData.locationAddress}
              onCommit={(newValue) => {
                updateRowFields(actualRow, colIndex, { locationAddress: newValue });
                setEditingCell({ row: null, col: null });
              }}
              autoFocus={true}
              disabled={!isEditable}
            />
          ) : (
            <span
  className="editable-text"
  onClick={isEditable ? () => setEditingCell({ row: actualRow, col: colIndex }) : undefined}
>
              {cellData.locationAddress || "Vnesi naslov..."}
            </span>
          )}
        </div>
        <div className="big-row">
          <select
            onChange={(e) => {
              const selected = e.target.value;
              if (selected !== "") {
                const currentWorkers = Array.isArray(cellData.worker)
                  ? cellData.worker
                  : [];
                updateRowFields(actualRow, colIndex, { worker: [...currentWorkers, selected] });
              }
              e.target.selectedIndex = 0;
            }}
            disabled={!isEditable}
          >
            <option value="">Izberi monterja</option>
            {workerOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <div className="worker-list">
            {Array.isArray(cellData.worker) &&
              cellData.worker.map((w, idx) => (
                <span
                  key={idx}
                  className="worker-item"
                  onClick={() => removeWorker(actualRow, colIndex, idx)}
                >
                  {w}
                  <span className="remove-icon"> ×</span>
                </span>
              ))}
          </div>
        </div>
        <div className="bottom-row">
          <div className="cell-actions">
            <button
  className="action-btn copy-btn"
  onClick={() => handleCopy(actualRow, colIndex)}
>
  <FaCopy />
</button>
<button
  className="action-btn clear-btn"
  onClick={() => handleClear(actualRow, colIndex)}
>
  <FaTrash />
</button>
<button
  className="action-btn paste-btn"
  onClick={() => handlePaste(actualRow, colIndex)}
>
  <FaPaste />
</button>
          </div>
          <select
            value={cellData.enteredBy}
            onChange={(e) =>
              updateRowFields(actualRow, colIndex, { enteredBy: e.target.value })
            }
            disabled={!isEditable}
          >
            <option value="">Vpisuje:</option>
            {enteredByOptions.map((eb) => (
              <option key={eb} value={eb}>
                {eb}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const sortedOrders = [...workOrders]
    .filter((order) => !order.dropped)
  .filter(order =>
    showSentOnly
      ? order.sentToMontaza                  // če je filter ON → pokaži samo poslane
      : !order.sentToMontaza                 // če je filter OFF → pokaži samo ne-poslane
  )
    .sort((a, b) => {
      const aAssigned = a.importedToTermPlan ? 1 : 0;
      const bAssigned = b.importedToTermPlan ? 1 : 0;
      return aAssigned - bAssigned;
    });

  return (
    <div className="term-plan-container">
      <h1>Terminski Plan - Montaža</h1>
<div style={{ marginBottom: 16 }}>
  {lock && lock.username ? (
    <div style={{ color: lock.username === username ? "green" : "red" }}>
      {lock.username === username
        ? "Ti trenutno urejaš! (zaklenjeno zate)"
        : (
            <>
              Uporabnik <b>{lock.username}</b> ureja terminski plan.<br />
            </>
          )
      }
      {/* prikaz časa */}
      {lock.timestamp &&
        <div style={{ fontSize: "0.9em", marginTop: 4, color: "#666" }}>
          ({new Date(lock.timestamp).toLocaleString("sl-SI")})
        </div>
      }
    </div>
  ) : (
    <div style={{ color: "gray" }}>
      Terminski plan ni zaklenjen.
      <br />
      <button
    className="edit-lock-btn"
    onClick={() => lockPlan()}
    disabled={locking}
  >
    Uredi
  </button>
    </div>
  )}
{lock && lock.username === username && (
  <button
    className="save-lock-btn"
onClick={async () => {
  await dispatch(updateTermPlan({ weekKey: currentWeekKey, gridData, dayNotes }));
  unlockPlan();
}}    disabled={locking}
    style={{ marginLeft: 12 }}
  >
    Shrani
  </button>
)}
{isEditable && dirty && (
<div
  style={{
    background: "#fff3cd",           // svetlo rumena
    color: "#a97a00",                // temnejša oranžna/bakrena
    fontWeight: "bold",
    marginBottom: 12,
    padding: "16px 24px",
    border: "2px solid #ffe083",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(200,120,0,0.08)",
    display: "flex",
    alignItems: "center",
    fontSize: "1.15em",
    gap: "10px"
  }}
>
  <span role="img" aria-label="warning" style={{ fontSize: "1.6em" }}>⚠️</span>
  Imaš <b>neshranjene spremembe!</b> Ne pozabi klikniti <b>Shrani</b>.
</div>

)}
  {lockError && (
    <div style={{ color: "red", fontWeight: "bold" }}>{lockError}</div>
  )}
</div>
      <div className="top-controls">
        <div className="search-bar-container">
          <EditableInput
            initialValue={searchTerm}
            onCommit={(val) => setSearchTerm(val)}
            placeholder="Iskanje po imenu/priimku ali naslovu..."
            autoFocus={false}
            disabled={!isEditable}
          />
          <button className="search-btn" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
        <div className="week-nav-container">
          <button className="week-arrow" onClick={goPrevWeek}>
            <FaArrowLeft />
          </button>
          <span className="week-range">{getRangeString(currentMonday)}</span>
          <button className="week-arrow" onClick={goNextWeek}>
            <FaArrowRight />
          </button>
        </div>
      </div>

      <div className="plan-content">
        <div className="plan-grid-section">
          <div className="term-plan-grid">
            {Array.from({ length: gridData.length + 2 }).map((_, rowIndex) =>
              dayNames.map((_, colIndex) => renderGridItem(rowIndex, colIndex))
            )}
          </div>
          <div className="control-buttons">
            <button className="add-row-btn" onClick={addRow} disabled={!isEditable}>
  <span className="add-icon">+</span> Dodaj vrstico
</button>
<button
  className="delete-row-btn-outside"
  onClick={deleteLastRow}
  disabled={!isEditable || gridData.length <= 2}
>
  Izbriši vrstico
</button>
<button
  className="save-lock-btn"
  onClick={handleFullSaveAndUnlock}
  disabled={!isEditable}
>
  Shrani spremembe
</button>
          </div>
        </div>
        <div className="orange-boxes-container">
          <h2>Montaža nalogi</h2>
          <button
  style={{
    background: showSentOnly ? "#34c759" : "#eee",
    color: showSentOnly ? "#fff" : "#222",
    border: "1px solid #34c759",
    borderRadius: 8,
    padding: "6px 16px",
    fontWeight: "bold",
    marginBottom: 8,
    marginLeft: 0,
    cursor: "pointer"
  }}
  onClick={() => setShowSentOnly((prev) => !prev)}
>
  Poslani v montažo
</button>
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => (
<div
  key={order._id}
  className={
    (order.sentToMontaza
      ? "sent-montaza-box"
      : order.importedToTermPlan
      ? "green-box"
      : "orange-box") +
    " " +
    getOrderBoxClass(order)
  }
  draggable={order.importedToTermPlan ? "true" : "false"}
                onDragStart={
                  order.importedToTermPlan
                    ? (e) =>
                        e.dataTransfer.setData(
                          "text/plain",
                          JSON.stringify({
                            id: order._id,
                            jobNumber: order.count_code,
                            clientName: order.partner?.customer || "",
                            locationAddress:
                              order.partner && order.partner.street
                                ? `${order.partner.street}, ${order.partner.place}`
                                : ""
                          })
                        )
                    : undefined
                }
                onClick={() => setSelectedOrder(order)}
              >
                <p>
                  <strong>Št. naloga:</strong>{" "}
                  {order.count_code || "Ni podatka"}
                </p>
                <p>
                  <strong>Stranka:</strong>{" "}
                  {order.partner?.customer || "Ni podatka"}
                </p>
                <p>
                  <strong>Rok izdelave:</strong>{" "}
                  {formatDate(order.produce_deadline_date)}
                </p>
                <p>
                  <strong>Naslov:</strong>{" "}
                  {order.partner && order.partner.street
                    ? `${order.partner.street}, ${order.partner.place}`
                    : "Ni podatka"}
                </p>
                <p>
                  <strong>Dodaten naslov:</strong>{" "}
                  {order.additionalAddress || "Ni dodatnega naslova"}
                </p>
                <p>
                  <strong>Dodatna navodila:</strong>{" "}
                  {order.additionalInstructions || "Ni navodil"}
                </p>
              </div>
            ))
          ) : (
            <p>Ni nalogov za montažo.</p>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderSummaryModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function OrderSummaryModal({ order, onClose }) {
  const dispatch = useDispatch();

  const confirmOrder = () => {
    const updatedOrder = {
      ...order,
      importedToTermPlan: true,
      droppedAt: Date.now()
    };
    dispatch(updateWorkOrderThunk(updatedOrder));
    onClose();
  };
  
  const sendToMontaza = () => {
  const updatedOrder = {
    ...order,
    sentToMontaza: true,
    sentAt: Date.now(),
  };
  dispatch(updateWorkOrderThunk(updatedOrder));
  onClose();
};

  return (
    <div className="modal-overlay">
      <div className="order-summary-modal">
        <h2>Podrobnosti delovnega naloga</h2>
        <p><strong>Št. naloga:</strong> {order.count_code || "Ni podatka"}</p>
        <p>
          <strong>Datum in ura izdelave naloga:</strong>{" "}
          {order.doc_date_created ? formatDate(order.doc_date_created) : "Ni podatka"}
        </p>
        <p><strong>Stranka:</strong> {order.partner?.customer || "Ni podatka"}</p>
        <p><strong>Naslov:</strong> {order.partner ? getAddress(order.partner) : "Ni podatka"}</p>
        <p><strong>Dodaten naslov:</strong> {order.additionalAddress || "Ni dodatnega naslova"}</p>
        <p><strong>Naziv:</strong> {order.title || "Ni podatka"}</p>
        <p>
          <strong>Rok izdelave:</strong>{" "}
          {order.produce_deadline_date ? formatDate(order.produce_deadline_date) : "Ni podatka"}
        </p>
        <p>
          <strong>Dodatna navodila:</strong>{" "}
          {order.additionalInstructions || "Ni navodil"}
        </p>
<div className="modal-buttons">
  {/* Prikaži Potrdi, če še ni potrjen */}
  {!order.importedToTermPlan && (
    <button className="confirm-btn left-btn" onClick={confirmOrder}>
      Potrdi
    </button>
  )}

  {/* Če je potrjen, a še ni poslan v montažo, prikaži Pošlji v montažo */}
  {order.importedToTermPlan && !order.sentToMontaza && (
    <button className="send-btn" style={{ background: "#34c759", color: "#fff", fontWeight: "bold" }} onClick={sendToMontaza}>
      Pošlji v montažo
    </button>
  )}

  {/* Vedno prikaži zapri */}
  <button className="reset-btn" onClick={onClose}>
    <FaTimes />
  </button>
</div>
      </div>
    </div>
  );
}

export default TerminskiPlan;

