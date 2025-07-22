import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSync } from "react-icons/fa";
import api from "../services/api"; // Uvozi Axios instanco
import { getWorkOrder, updateWorkOrder } from "../store/workOrdersSlice";
import processWorkOrderData from "../utils/processWorkOrderData";
import "./Search.css";

// Mapping skrbnikov glede na mk_id
const caretakerMapping = {
  "mk_id_1": "Skrbnik 1",
  "mk_id_2": "Skrbnik 2",
  "mk_id_3": "Skrbnik 3",
};

// Funkcija za formatiranje datuma
const formatDateTime = (dateStr) => {
  if (!dateStr) return "Ni podatka";
  if (!dateStr.includes("T") && dateStr.length >= 10) {
    const [year, month, day] = dateStr.substring(0, 10).split("-");
    return `${day}.${month}.${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("sl-SI");
};

// Funkcija za sestavo naslova iz partnerjevih podatkov
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

const Search = () => {
  const [docId, setDocId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedWorkOrder, setEditedWorkOrder] = useState(null);
  const [montazaChecked, setMontazaChecked] = useState(false);
  const [prevzemChecked, setPrevzemChecked] = useState(false);
  const [dostavaChecked, setDostavaChecked] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lokalni state za dodatna navodila in dodaten naslov – ta polja so vedno urejena
  const [additionalInstructionsInput, setAdditionalInstructionsInput] = useState("");
  const [additionalAddressInput, setAdditionalAddressInput] = useState("");

  // Uporaba Redux stanja: orders, loading in error
  const { orders, loading, error } = useSelector((state) => state.workOrders);
  
  // Izberemo zadnji (najbolj sveži) delovni nalog iz seznama, če obstaja
  const workOrder = orders.length > 0 ? orders[orders.length - 1] : null;

  // Ko se workOrder spremeni, inicializiraj checkbox-e in dodatna polja
  useEffect(() => {
    if (workOrder) {
      setMontazaChecked(workOrder.montaza || false);
      setPrevzemChecked(workOrder.prevzem || false);
      setDostavaChecked(workOrder.dostava || false);
      setAdditionalInstructionsInput(workOrder.additionalInstructions || "");
      setAdditionalAddressInput(workOrder.additionalAddress || "");
    }
  }, [workOrder]);

  const getProductExtra = (item) => {
    const notes = item.notes && item.notes.trim() ? item.notes.trim() : "";
    const desc = item.product_workorder_desc && item.product_workorder_desc.trim()
      ? item.product_workorder_desc.trim()
      : "";
    return notes || desc;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!docId.trim()) return;
    dispatch(getWorkOrder(docId));
  };

  const handleEdit = () => {
    // Globoko kopiramo, da ne pride do nenamernih sprememb
    setEditedWorkOrder(JSON.parse(JSON.stringify(workOrder)));
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (editedWorkOrder) {
      console.log("Shranjujem iz EDIT MODE:", editedWorkOrder);
      dispatch(updateWorkOrder(editedWorkOrder));
    }
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleMainFieldChange = (e) => {
    const { name, value } = e.target;
    setEditedWorkOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handlePartnerFieldChange = (e) => {
    const { name, value } = e.target;
    setEditedWorkOrder((prev) => ({
      ...prev,
      partner: { ...prev.partner, [name]: value },
    }));
  };

  // Checkbox logika: omogoči le en checkbox hkrati
const handleMontazaChange = (e) => {
  const checked = e.target.checked;
  setMontazaChecked(checked);
  setPrevzemChecked(false);
  setDostavaChecked(false);
  if (workOrder) {
    const updated = {
      ...workOrder,
      montaza: checked,
      prevzem: false,
      dostava: false,
    };
    dispatch(updateWorkOrder(updated));
  }
  if (editMode && editedWorkOrder) {
    setEditedWorkOrder({
      ...editedWorkOrder,
      montaza: checked,
      prevzem: false,
      dostava: false,
    });
  }
};

const handlePrevzemChange = (e) => {
  const checked = e.target.checked;
  setPrevzemChecked(checked);
  setMontazaChecked(false);
  setDostavaChecked(false);
  if (workOrder) {
    const updated = {
      ...workOrder,
      prevzem: checked,
      montaza: false,
      dostava: false,
    };
    dispatch(updateWorkOrder(updated));
  }
  if (editMode && editedWorkOrder) {
    setEditedWorkOrder({
      ...editedWorkOrder,
      prevzem: checked,
      montaza: false,
      dostava: false,
    });
  }
};

const handleDostavaChange = (e) => {
  const checked = e.target.checked;
  setDostavaChecked(checked);
  setMontazaChecked(false);
  setPrevzemChecked(false);
  if (workOrder) {
    const updated = {
      ...workOrder,
      dostava: checked,
      montaza: false,
      prevzem: false,
    };
    dispatch(updateWorkOrder(updated));
  }
  if (editMode && editedWorkOrder) {
    setEditedWorkOrder({
      ...editedWorkOrder,
      dostava: checked,
      montaza: false,
      prevzem: false,
    });
  }
};

  // Funkcija, ki poskrbi, da če je nalog že poslan v delo (confirmed), preveri morebitne spremembe
  // in jih posodobi v bazi.
  const handleSendToWorkshop = async () => {
    if (!workOrder || !workOrder.count_code) {
      alert("Delovni nalog ni veljaven ali ni najden. Preverite vnos doc_id.");
      return;
    }
    
    // Če je nalog že poslan v delo, preverimo spremembe
    if (workOrder.confirmed) {
      let updatedFields = {};
      if (workOrder.additionalInstructions !== additionalInstructionsInput) {
        updatedFields.additionalInstructions = additionalInstructionsInput;
      }
      if (workOrder.additionalAddress !== additionalAddressInput) {
        updatedFields.additionalAddress = additionalAddressInput;
      }
      // Dodaj lahko še druga polja, ki jih želite primerjati
      
      if (Object.keys(updatedFields).length > 0) {
        const updatedOrder = { ...workOrder, ...updatedFields };
        dispatch(updateWorkOrder(updatedOrder));
        alert("Naloga je bila posodobljena z novimi spremembami.");
      } else {
        alert("Naloga je že poslana v delo in ni novih sprememb.");
      }
      return;
    }
    
    // Če nalog še ni poslan v delo, nadaljuj z obdelavo in pošiljanjem
    const updatedOrder = {
  ...workOrder,
  confirmed: true,
  montaza: montazaChecked,
  prevzem: prevzemChecked,
  dostava: dostavaChecked,
  additionalInstructions: additionalInstructionsInput,
  additionalAddress: additionalAddressInput,
};

    console.log("Delovni nalog pred procesiranjem:", updatedOrder);
    
    const processedOrder = processWorkOrderData(updatedOrder);
    console.log("Obdelan (processed) delovni nalog:", processedOrder);
    
    try {
      const response = await api.post("/api/workorders", processedOrder);
      const savedOrder = response.data;
      console.log("Delovni nalog shranjen:", savedOrder);
      
      dispatch(updateWorkOrder(savedOrder));
      
      navigate("/workshop", { state: { workOrder: savedOrder } });
    } catch (error) {
      console.error("Napaka pri pošiljanju naloga v delo:", error);
      alert("Prišlo je do napake pri shranjevanju delovnega naloga.");
    }
  };

  // Handlerji za potrditev dodatnih polj
  const handleConfirmAdditionalInstructions = () => {
    const updatedOrder = { ...workOrder, additionalInstructions: additionalInstructionsInput };
    dispatch(updateWorkOrder(updatedOrder));
  };

  const handleConfirmAdditionalAddress = () => {
    const updatedOrder = { ...workOrder, additionalAddress: additionalAddressInput };
    dispatch(updateWorkOrder(updatedOrder));
  };

  return (
    <div className="search-container">
      <h2>Iskanje delovnega naloga</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          placeholder="Vnesi doc_id (npr. 509000488773)"
        />
        <button type="submit">Išči</button>
        {/* Gumb za refresh */}
        <button
          type="button"
          className="refresh-button"
          onClick={() => window.location.reload()}
          title="Osveži stran"
        >
          <FaSync />
        </button>
      </form>
      {loading && <p>Nalaganje...</p>}
      {error && <p className="error">{error}</p>}
      
      {workOrder && !editMode && (
        <div className="workorder-details">
          <h3>Podatki delovnega naloga</h3>
          <p>
            <strong>Št. Naloga:</strong> {workOrder.count_code || "Ni podatka"}
          </p>
          <p>
            <strong>Datum in ura izdelave:</strong> {formatDateTime(workOrder.doc_date_created)}
          </p>
          <p>
            <strong>Stranka:</strong> {workOrder.partner?.customer || "Ni podatka"}
          </p>
          <p>
            <strong>Naslov:</strong> {getAddress(workOrder.partner)}
          </p>
          <p>
            <strong>Naziv:</strong> {workOrder.title || "Ni podatka"}
          </p>
          <p>
            <strong>Rok izdelave:</strong> {formatDateTime(workOrder.produce_deadline_date)}
          </p>
          <p>
            <strong>Skrbnik:</strong>{" "}
            {workOrder.caretaker_list && workOrder.caretaker_list.length > 0
              ? caretakerMapping[workOrder.caretaker_list[0].mk_id] || "Neznan skrbnik"
              : "Ni podatka"}
          </p>
          <div>
            <h4>Artikli za izdelavo:</h4>
            {workOrder.create_product_realization_list &&
            workOrder.create_product_realization_list.length > 0 ? (
              <table className="production-table">
                <thead>
                  <tr>
                    <th>Šifra - Naziv</th>
                    <th>Plan - Količina</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.create_product_realization_list.map((item, index) => {
                    const extra = getProductExtra(item);
                    return (
                      <tr key={index}>
                        <td>
                          {item.product_code} - {item.product_title}{" "}
                          {extra && <span className="product-desc">{extra}</span>}
                        </td>
                        <td>
                          {item.amount_plan} {item.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>Ni artiklov za izdelavo.</p>
            )}
          </div>
          <div className="additional-instructions">
            <h4>Dodatna navodila:</h4>
            <textarea
              value={additionalInstructionsInput}
              onChange={(e) => setAdditionalInstructionsInput(e.target.value)}
              rows="4"
              style={{ width: "100%", resize: "vertical" }}
            />
            <button onClick={handleConfirmAdditionalInstructions}>Potrdi navodila</button>
          </div>
          <div className="additional-address">
            <h4>Dodaten naslov:</h4>
            <textarea
              value={additionalAddressInput}
              onChange={(e) => setAdditionalAddressInput(e.target.value)}
              rows="4"
              style={{ width: "100%", resize: "vertical" }}
            />
            <button onClick={handleConfirmAdditionalAddress}>Potrdi naslov</button>
          </div>
<div className="checkbox-group">
  <label>
    <input
      type="checkbox"
      checked={montazaChecked}
      onChange={handleMontazaChange}
    />
    Montaža
  </label>
  <label>
    <input
      type="checkbox"
      checked={prevzemChecked}
      onChange={handlePrevzemChange}
    />
    Prevzem
  </label>
  <label>
    <input
      type="checkbox"
      checked={dostavaChecked}
      onChange={handleDostavaChange}
    />
    Dostava
  </label>
</div>
<div className="button-group">
  <button className="delete-button" onClick={() => {/* Logika za brisanje naloga */}}>
    Izbriši
  </button>
  <button className="edit-button" onClick={handleEdit}>
    Uredi
  </button>
  <button className="send-button" onClick={handleSendToWorkshop}>
    Pošlji v delo
  </button>
</div>
        </div>
      )}

      {workOrder && editMode && (
        <div className="workorder-details">
          <h3>Uredi delovni nalog</h3>
          <label>
            <strong>Št. Naloga:</strong>
            <input
              type="text"
              name="count_code"
              value={editedWorkOrder.count_code || ""}
              onChange={handleMainFieldChange}
            />
          </label>
          <label>
            <strong>Datum in ura izdelave:</strong>
            <input
              type="text"
              name="doc_date_created"
              value={editedWorkOrder.doc_date_created || ""}
              onChange={handleMainFieldChange}
            />
          </label>
          <label>
            <strong>Stranka:</strong>
            <input
              type="text"
              name="customer"
              value={editedWorkOrder.partner?.customer || ""}
              onChange={handlePartnerFieldChange}
            />
          </label>
          <label>
            <strong>Ulica:</strong>
            <input
              type="text"
              name="street"
              value={editedWorkOrder.partner?.street || ""}
              onChange={handlePartnerFieldChange}
            />
          </label>
          <label>
            <strong>Poštna številka:</strong>
            <input
              type="text"
              name="post_number"
              value={editedWorkOrder.partner?.post_number || ""}
              onChange={handlePartnerFieldChange}
            />
          </label>
          <label>
            <strong>Mesto:</strong>
            <input
              type="text"
              name="place"
              value={editedWorkOrder.partner?.place || ""}
              onChange={handlePartnerFieldChange}
            />
          </label>
          <label>
            <strong>Država:</strong>
            <input
              type="text"
              name="country"
              value={editedWorkOrder.partner?.country || ""}
              onChange={handlePartnerFieldChange}
            />
          </label>
          <label>
            <strong>Naziv:</strong>
            <input
              type="text"
              name="title"
              value={editedWorkOrder.title || ""}
              onChange={handleMainFieldChange}
            />
          </label>
          <label>
            <strong>Rok izdelave:</strong>
            <input
              type="text"
              name="produce_deadline_date"
              value={editedWorkOrder.produce_deadline_date || ""}
              onChange={handleMainFieldChange}
            />
          </label>
          <label>
            <strong>Dodatna navodila:</strong>
            <textarea
              name="additionalInstructions"
              value={editedWorkOrder.additionalInstructions || ""}
              onChange={handleMainFieldChange}
              rows="4"
              style={{ width: "100%", resize: "vertical" }}
            />
            <button onClick={() => {
              const updatedOrder = { ...editedWorkOrder, additionalInstructions: editedWorkOrder.additionalInstructions };
              dispatch(updateWorkOrder(updatedOrder));
            }}>Potrdi navodila</button>
          </label>
          <label>
            <strong>Dodaten naslov:</strong>
            <textarea
              name="additionalAddress"
              value={editedWorkOrder.additionalAddress || ""}
              onChange={handleMainFieldChange}
              rows="4"
              style={{ width: "100%", resize: "vertical" }}
            />
            <button onClick={() => {
              const updatedOrder = { ...editedWorkOrder, additionalAddress: editedWorkOrder.additionalAddress };
              dispatch(updateWorkOrder(updatedOrder));
            }}>Potrdi naslov</button>
          </label>
<div className="checkbox-group">
  <label>
    <input
      type="checkbox"
      name="montaza"
      checked={editedWorkOrder.montaza || false}
      onChange={e =>
        setEditedWorkOrder({
          ...editedWorkOrder,
          montaza: e.target.checked,
          prevzem: false,
          dostava: false,
        })
      }
    />
    Montaža
  </label>
  <label>
    <input
      type="checkbox"
      name="prevzem"
      checked={editedWorkOrder.prevzem || false}
      onChange={e =>
        setEditedWorkOrder({
          ...editedWorkOrder,
          prevzem: e.target.checked,
          montaza: false,
          dostava: false,
        })
      }
    />
    Prevzem
  </label>
  <label>
    <input
      type="checkbox"
      name="dostava"
      checked={editedWorkOrder.dostava || false}
      onChange={e =>
        setEditedWorkOrder({
          ...editedWorkOrder,
          dostava: e.target.checked,
          montaza: false,
          prevzem: false,
        })
      }
    />
    Dostava
  </label>
</div>
          <h4>Uredi artikle:</h4>
          {editedWorkOrder.create_product_realization_list &&
          editedWorkOrder.create_product_realization_list.length > 0 && (
            <table className="production-table">
              <thead>
                <tr>
                  <th>Šifra</th>
                  <th>Naziv</th>
                  <th>Dodatni opis</th>
                  <th>Količina</th>
                </tr>
              </thead>
              <tbody>
                {editedWorkOrder.create_product_realization_list.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        name="product_code"
                        value={item.product_code || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditedWorkOrder((prev) => {
                            const newList = prev.create_product_realization_list.map((it, i) =>
                              i === index ? { ...it, product_code: newValue } : it
                            );
                            return { ...prev, create_product_realization_list: newList };
                          });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="product_title"
                        value={item.product_title || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditedWorkOrder((prev) => {
                            const newList = prev.create_product_realization_list.map((it, i) =>
                              i === index ? { ...it, product_title: newValue } : it
                            );
                            return { ...prev, create_product_realization_list: newList };
                          });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="notes"
                        value={item.notes || item.product_workorder_desc || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditedWorkOrder((prev) => {
                            const newList = prev.create_product_realization_list.map((it, i) =>
                              i === index ? { ...it, notes: newValue } : it
                            );
                            return { ...prev, create_product_realization_list: newList };
                          });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="amount_plan"
                        value={item.amount_plan || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditedWorkOrder((prev) => {
                            const newList = prev.create_product_realization_list.map((it, i) =>
                              i === index ? { ...it, amount_plan: newValue } : it
                            );
                            return { ...prev, create_product_realization_list: newList };
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="button-group">
            <button className="save-btn" onClick={handleSaveEdit}>Shrani</button>
            <button className="cancel-btn" onClick={handleCancelEdit}>Prekliči</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
