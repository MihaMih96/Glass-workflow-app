// src/pages/TerminskiPlanPrevzem.js
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaSearch, FaTimes } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { updateWorkOrderThunk, getAllWorkOrders } from "../store/workOrdersSlice";
import "./TerminskiPlanPrevzem.css";

const TerminskiPlanPrevzem = () => {
  // Iz Redux stanja izberemo naloge, kjer je prevzem === true in nalog označen kot "Zaključeno"
  const workOrders = useSelector((state) =>
    state.workOrders.orders.filter(
      (order) => order.prevzem && order.ready === "Zaključeno"
    )
  );
  const dispatch = useDispatch();

  // Nalaganje naročil ob inicializaciji
  useEffect(() => {
    dispatch(getAllWorkOrders());
  }, [dispatch]);

  // Lokalni state
  const [showOnlyPrevzeti, setShowOnlyPrevzeti] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(new Date());

  // Generiranje datumskega razpona za tedensko navigacijo
  const getRangeString = (currentMonday) => {
    const startDay = currentMonday.getDate();
    const startMonth = currentMonday.getMonth() + 1;
    const endDate = new Date(currentMonday);
    endDate.setDate(endDate.getDate() + 4);
    return `${startDay}.${startMonth} - ${endDate.getDate()}.${endDate.getMonth() + 1}`;
  };

  const rangeString = getRangeString(currentMonday);

  const handleSearch = () => {
    setAppliedSearchTerm(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };


let visibleOrders = workOrders;

// 1. Filtiraj po search
visibleOrders = workOrders.filter((order) => {
  const customer = order.partner?.customer?.toLowerCase() || "";
  const jobNumber = (order.count_code || "").toLowerCase();
  const search = appliedSearchTerm.toLowerCase();
  return (
    customer.includes(search) ||
    jobNumber.includes(search)
  );
});

// Če je vklopljen filter, prikaži samo prevzete (zelene), sicer samo neprevzete (oranžne)
visibleOrders = visibleOrders.filter(order =>
  showOnlyPrevzeti ? order.importedToTermPlan === true : order.importedToTermPlan !== true
);


  // Potrditev naloge: poleg nastavitve importedToTermPlan na true se shrani tudi datum potrditve
  const confirmOrder = async (orderId) => {
    const order = workOrders.find((o) => o._id === orderId);
    if (order) {
      const updatedOrder = { 
        ...order, 
        importedToTermPlan: true,
        confirmedDate: new Date().toISOString() 
      };
      // Pošljemo posodobljen nalog, nato osvežimo naloge, da se sprememba prikaže
      await dispatch(updateWorkOrderThunk(updatedOrder));
      await dispatch(getAllWorkOrders());
      setSelectedOrder(null);
    }
  };

  // Ponastavitev statusa: nastavimo importedToTermPlan nazaj na false in odstranimo datum potrditve
  const resetOrder = async (orderId) => {
    const order = workOrders.find((o) => o._id === orderId);
    if (order) {
      const updatedOrder = { 
        ...order, 
        importedToTermPlan: false,
        confirmedDate: null 
      };
      await dispatch(updateWorkOrderThunk(updatedOrder));
      await dispatch(getAllWorkOrders());
      setSelectedOrder(null);
    }
  };

  return (
    <div className="term-plan-container">
      <h1>Terminski plan - Prevzem</h1>
      <div className="top-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Iskanje po imenu/priimku ali naslovu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
        <div className="week-nav-container">
          <button
            className="week-arrow"
            onClick={() =>
              setCurrentMonday(
                new Date(currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000)
              )
            }
          >
            <FaArrowLeft />
          </button>
          <span className="week-range">{rangeString}</span>
          <button
            className="week-arrow"
            onClick={() =>
              setCurrentMonday(
                new Date(currentMonday.getTime() + 7 * 24 * 60 * 60 * 1000)
              )
            }
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

  <div className="filter-controls" style={{ marginBottom: 12 }}>
<button
  style={{
    background: showOnlyPrevzeti ? "#3BB143" : "#eee",
    color: showOnlyPrevzeti ? "#fff" : "#333",
    border: "1px solid #3BB143",
    borderRadius: 6,
    fontWeight: "bold",
    padding: "7px 18px",
    cursor: "pointer"
  }}
  onClick={() => setShowOnlyPrevzeti(v => !v)}
>
  {showOnlyPrevzeti ? "Prikaži neprevzete" : "Prikaži prevzete"}
</button>
  </div>

      {/* Kontejner za vertikalno scrollanje */}
      <div className="prevzem-container">
        <div className="prevzem-orders">
{visibleOrders.length > 0 ? (
  visibleOrders.map((order) => (
              <div
                key={order._id}
                // Če je importedToTermPlan true, je kvadrat zelen, sicer oranžen
                className={order.importedToTermPlan ? "green-box" : "orange-box"}
                onClick={() => setSelectedOrder(order)}
              >
                <p>
                  <strong>Št. naloga:</strong> {order.count_code || "Ni podatka"}
                </p>
                <p>
                  <strong>Stranka:</strong> {order.partner?.customer || "Ni podatka"}
                </p>
                <p>
                  <strong>Rok izdelave:</strong>{" "}
                  {order.produce_deadline_date
                    ? new Date(order.produce_deadline_date).toLocaleDateString("sl-SI")
                    : "Ni podatka"}
                </p>
                <p>
                  <strong>Naslov:</strong>{" "}
                  {order.partner && order.partner.street
                    ? `${order.partner.street}, ${order.partner.place}`
                    : "Ni podatka"}
                </p>
                <p>
                  <strong>Dodatna navodila:</strong>{" "}
                  {order.additionalInstructions || "Ni navodil"}
                </p>
                <p>
                  <strong>Dodaten naslov:</strong>{" "}
                  {order.additionalAddress || "Ni dodatnega naslova"}
                </p>
                {order.importedToTermPlan && order.confirmedDate && (
                  <p>
                    <strong>Potrjen dne:</strong>{" "}
                    {new Date(order.confirmedDate).toLocaleDateString("sl-SI")}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>Ni nalogov za prevzem.</p>
          )}
        </div>
      </div>

      {/* Modal za prikaz podrobnosti naloge */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="order-summary-modal">
            <h2>Podrobnosti naloga</h2>
            <p>
              <strong>Št. naloga:</strong> {selectedOrder.count_code || "Ni podatka"}
            </p>
            <p>
              <strong>Stranka:</strong>{" "}
              {selectedOrder.partner?.customer || "Ni podatka"}
            </p>
            <p>
              <strong>Rok izdelave:</strong>{" "}
              {selectedOrder.produce_deadline_date
                ? new Date(selectedOrder.produce_deadline_date).toLocaleDateString("sl-SI")
                : "Ni podatka"}
            </p>
            <p>
              <strong>Naslov:</strong>{" "}
              {selectedOrder.partner && selectedOrder.partner.street
                ? `${selectedOrder.partner.street}, ${selectedOrder.partner.place}`
                : "Ni podatka"}
            </p>
            <p>
              <strong>Dodatna navodila:</strong>{" "}
              {selectedOrder.additionalInstructions || "Ni navodil"}
            </p>
            <p>
              <strong>Dodaten naslov:</strong>{" "}
              {selectedOrder.additionalAddress || "Ni dodatnega naslova"}
            </p>
            {selectedOrder.importedToTermPlan && selectedOrder.confirmedDate && (
              <p>
                <strong>Potrjen dne:</strong>{" "}
                {new Date(selectedOrder.confirmedDate).toLocaleDateString("sl-SI")}
              </p>
            )}
            <div className="modal-buttons">
              <button
                className="confirm-btn"
                onClick={() => confirmOrder(selectedOrder._id)}
              >
                Potrdi
              </button>
              <button
                className="reset-btn"
                onClick={() => resetOrder(selectedOrder._id)}
              >
                <FaTimes />
              </button>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedOrder(null)}
              >
                Zapri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminskiPlanPrevzem;
