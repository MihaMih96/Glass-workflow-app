import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./Orders.css";

// OPOMBA: V pravem okolju bo ta array zamenjan z imeni zaposlenih iz baze ali API-ja.
const USERS = [
 "uporabnik1",
 "uporabnik2",
 "uporabnik3",
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [item, setItem] = useState("");
  const [unit, setUnit] = useState("Kos");
  const [quantity, setQuantity] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal "Označi kot naročeno"
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [orderedBy, setOrderedBy] = useState("");

  // Modal za urejanje
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  // Pridobi vsa naročila
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/orders");
      setOrders(res.data);
    } catch (e) {
      alert("Napaka pri pridobivanju naročil");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Dodaj naročilo
const handleAddOrder = async (e) => {
  e.preventDefault();
  if (!item || !quantity || !createdBy) return alert("Izpolni vsa polja!");
  try {
    await api.post("/api/orders", { item, quantity, unit, createdBy }); // <-- TO JE "KLIC"
    setItem(""); setQuantity(""); setCreatedBy(""); setUnit("Kos");
    fetchOrders();
  } catch {
    alert("Napaka pri dodajanju naročila");
  }
};

  // Komponenta za dropdown uporabnika
  const SelectUser = ({ value, onChange, label }) => (
    <select value={value} onChange={e => onChange(e.target.value)} required>
      <option value="">{label}</option>
      {USERS.map(u => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  );

  // Modal za "Označi kot naročeno"
  const openOrderDialog = (id) => {
    setPendingOrderId(id);
    setOrderedBy("");
    setShowOrderDialog(true);
  };
  const closeOrderDialog = () => {
    setShowOrderDialog(false);
    setPendingOrderId(null);
    setOrderedBy("");
  };
  const submitOrderedBy = async () => {
    if (!orderedBy) return;
    try {
      await api.patch(`/api/orders/${pendingOrderId}/ordered`, { orderedBy });
      closeOrderDialog();
      fetchOrders();
    } catch {
      alert("Napaka pri označevanju kot naročeno");
    }
  };

  // --- Urejanje naročila ---
  const openEditModal = (order) => {
    setEditOrder({ ...order });
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditOrder(null);
    setEditModalOpen(false);
  };
  const handleEditChange = (key, value) => {
    setEditOrder((old) => ({ ...old, [key]: value }));
  };
  const submitEditOrder = async () => {
    if (!editOrder.item || !editOrder.quantity || !editOrder.createdBy) {
      alert("Izpolni vsa polja!");
      return;
    }
    try {
      await api.patch(`/api/orders/${editOrder._id}`, {
        item: editOrder.item,
        quantity: editOrder.quantity,
        unit: editOrder.unit, // <-- DODAJ TO!
        createdBy: editOrder.createdBy
      });
      closeEditModal();
      fetchOrders();
    } catch {
      alert("Napaka pri shranjevanju sprememb");
    }
  };

  // --- Brisanje naročila ---
  const deleteOrder = async (id) => {
    if (!window.confirm("Res želiš izbrisati naročilo?")) return;
    try {
      await api.delete(`/api/orders/${id}`);
      fetchOrders();
    } catch {
      alert("Napaka pri brisanju naročila");
    }
  };

  return (
    <div className="orders-page">
      <h2>Naročila materiala</h2>
      <form className="order-form" onSubmit={handleAddOrder}>
        <input
          type="text"
          placeholder="Kaj potrebuješ?"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          type="number"
          min="1"
          placeholder="Količina"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
          <select value={unit} onChange={e => setUnit(e.target.value)} style={{ flex: 1 }}>
    <option value="Kos">Kos</option>
    <option value="m2">m2</option>
    <option value="KPL">KPL</option>
    <option value="Plošča">Plošča</option>
  </select>
        <SelectUser
          value={createdBy}
          onChange={setCreatedBy}
          label="Kdo vpisuje?"
        />
        <button type="submit">Dodaj</button>
      </form>

      {loading ? <div>Nalaganje...</div> : (
        <div className="orders-list">
          {orders.length === 0 && <div>Trenutno ni naročil.</div>}
          {orders.map((o) => (
            <div
              key={o._id}
              className={`order-card ${o.status === "ordered" ? "ordered" : "pending"}`}
            >
              <div className="order-card-main">
<div>
  <b>{o.item}</b>
  <br />
<span className="order-qty">Količina: {o.quantity} {o.unit || "Kos"}</span>
  <br />
  <span>Vpisal: {o.createdBy}</span>
  <br />
  {o.status === "ordered" ? (
    <span>
      <b>Naročeno:</b> {o.orderedAt && (new Date(o.orderedAt).toLocaleString())}
      {o.orderedBy && <> ({o.orderedBy})</>}
    </span>
  ) : (
    <button onClick={() => openOrderDialog(o._id)}>Označi kot naročeno</button>
  )}
</div>
                <div className="order-card-actions">
                  <button className="btn-edit" onClick={() => openEditModal(o)}>Uredi</button>
                  <button className="btn-delete" onClick={() => deleteOrder(o._id)}>Izbriši</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal za označi kot naročeno */}
      {showOrderDialog && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal order-modal">
            <h4>Kdo je naročil?</h4>
            <SelectUser value={orderedBy} onChange={setOrderedBy} label="Izberi uporabnika" />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 14 }}>
              <button
                className="btn-confirm"
                onClick={submitOrderedBy}
                disabled={!orderedBy}
              >
                Naročeno
              </button>
              <button className="btn-cancel" onClick={closeOrderDialog}>Prekliči</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za urejanje naročila */}
      {editModalOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal order-modal">
            <h4>Uredi naročilo</h4>
            <input
              type="text"
              value={editOrder.item}
              onChange={e => handleEditChange("item", e.target.value)}
              placeholder="Kaj potrebuješ?"
              style={{ marginBottom: 10, width: "100%" }}
            />
            <input
              type="number"
              min="1"
              value={editOrder.quantity}
              onChange={e => handleEditChange("quantity", e.target.value)}
              placeholder="Količina"
              style={{ marginBottom: 10, width: "100%" }}
            />
            <select
  value={editOrder.unit || "Kos"}
  onChange={e => handleEditChange("unit", e.target.value)}
  style={{ marginBottom: 10, width: "100%" }}
>
  <option value="Kos">Kos</option>
  <option value="m2">m2</option>
  <option value="KPL">KPL</option>
  <option value="Plošča">Plošča</option>
</select>
            <SelectUser
              value={editOrder.createdBy}
              onChange={v => handleEditChange("createdBy", v)}
              label="Kdo vpisuje?"
            />
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 14 }}>
              <button className="btn-confirm" onClick={submitEditOrder}>Shrani</button>
              <button className="btn-cancel" onClick={closeEditModal}>Prekliči</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
