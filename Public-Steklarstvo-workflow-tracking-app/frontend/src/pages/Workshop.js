import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import FlipMove from "react-flip-move";
import {
  FaCubes,
  FaCut,
  FaLayerGroup,
  FaFlask,
  FaDraftingCompass,
  FaPaintBrush,
  FaTools,
  FaWrench,
  FaStickyNote,
  FaHourglassHalf,
  FaSearch,
  FaCheck,
  FaTimes,
  FaTruck,
  FaPencilAlt,
  FaHome,
  FaShoppingCart,
  FaCalendarAlt,
  FaPaintRoller,
  FaTrash
} from "react-icons/fa";
import { 
  getAllWorkOrders, 
  updateWorkOrder, 
  updateWorkOrderThunk,
  deleteWorkOrderThunk
} from "../store/workOrdersSlice";
import "./Workshop.css";

// Funkcija, ki vrne barvo gumba hiške (uporabljena v modalih)
const getHouseButtonColor = (article) => {
  const state = article.houseStatus || 0;
  if (state === 1) return "yellow";
  if (state === 2) return "green";
  return "white";
};

// Funkcija, ki vrne barvo gumba spray (uporabljena v modalih)
const getSprayButtonColor = (article) => {
  const status = article.sprayStatus || 0;
  return (status === 1 || status === 2) ? "#add8e6" : "white";
};

// Funkcija, ki vrne barvo gumba vozička (cart)
const getCartButtonColor = (article) => {
  const state = article.cartStatus || 0;
  if (state === 1) return "yellow";  // Naročeno
  if (state === 2) return "green";   // Prevzeto
  return "white";
};

// Funkcija, ki na osnovi artikla vrne status (tekst in ozadje).
const getStatusForCell = (article) => {
  if (article.sprayStatus !== undefined && article.sprayStatus !== null && article.sprayStatus !== 0) {
    let text = "";
    if (article.sprayStatus === 1) {
      text = "v Barvanju";
    } else if (article.sprayStatus === 2) {
      text = "Pobarvano";
    }
    return { text, bg: "#add8e6" };
  }
  if (article.houseStatus !== undefined && article.houseStatus !== null) {
    if (article.houseStatus === 1) return { text: "Pripravi iz zaloge", bg: "yellow" };
    if (article.houseStatus === 2) return { text: "Pripravljeno iz zaloge", bg: "green" };
  }
  if (article.cartStatus !== undefined && article.cartStatus !== null) {
    if (article.cartStatus === 1) return { text: "Naročeno", bg: "yellow" };
    if (article.cartStatus === 2) return { text: "Prevzeto", bg: "green" };
  }
  return { text: "STATUS", bg: "white" };
};

const getTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "Ni podatka";
  if (dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return `${day}.${month}.${year}`;
  }
  if (dateStr.length >= 10) {
    const datePart = dateStr.substring(0, 10);
    const [yr, mo, da] = datePart.split("-");
    return `${da}.${mo}.${yr}`;
  }
  return dateStr;
};

const removeNewlines = (value) => {
  const str = String(value || "");
  let cleaned = str.replace(/\r?\n/g, " ");
  cleaned = cleaned.replace(/\s\s+/g, " ");
  return cleaned.trim();
};

const getMontazaOrPrevzemLabel = (order) => {
  if (!order) return "";
  if (order.montaza) return "Tip: MONTAŽA";
  if (order.prevzem) return "Tip: PREVZEM";
  if (order.dostava) return "Tip: DOSTAVA";
  return "";
};

const Workshop = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.workOrders.orders);
  
  console.log("Redux orders:", orders);
  console.log("Location state:", location.state);

  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedOrder, setHighlightedOrder] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [modalData, setModalData] = useState({
    open: false,
    orderId: null,
    sector: null,
    products: [],
    finishedStatus: {},
    orderedStatus: {},
    receivedStatus: {}
  });
  const [orderDetailsModal, setOrderDetailsModal] = useState({
    open: false,
    orderId: null
  });
  const [noteModalData, setNoteModalData] = useState({
    open: false,
    productCellId: null,
    note: ""
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [confirmModal, setConfirmModal] = useState({
  open: false,
  orderId: null,
});
const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, orderId: null });

  // ★ filter za prikaz zaključenih/aktivnih nalogov
const [showCompleted, setShowCompleted] = useState(false);

  const allSectors = [
    "Zunanji steklar",
    "Odrez in obdelava stekla",
    "Kaljenje ali/in lepljenje stekla",
    "Premaz stekla",
    "Izris in priprava folije",
    "Lepljenje folije/peskanje",
    "Ostala obdelava stekla",
    "Okovje, okvirji",
    "Barvanje profilov/obdelava kovine",
    "Storitev delavnica",
    "Ostalo"
  ];

  const sectorData = {
    "Zunanji steklar": { icon: <FaCubes />, color: "#add8e6" },
    "Odrez in obdelava stekla": { icon: <FaCut />, color: "#fff8e1" },
    "Kaljenje ali/in lepljenje stekla": { icon: <FaLayerGroup />, color: "#c8e6c9" },
    "Premaz stekla": { icon: <FaFlask />, color: "#fff8e1" },
    "Izris in priprava folije": { icon: <FaDraftingCompass />, color: "#add8e6" },
    "Lepljenje folije/peskanje": { icon: <FaPaintBrush />, color: "#fff8e1" },
    "Ostala obdelava stekla": { icon: <FaTools />, color: "#c8e6c9" },
    "Okovje, okvirji": { icon: <FaStickyNote />, color: "#add8e6" },
    "Barvanje profilov/obdelava kovine": { icon: <FaHourglassHalf />, color: "#c8e6c9" },
    "Storitev delavnica": { icon: <FaTools />, color: "#fff8e1" },
    "Ostalo": { icon: <FaWrench />, color: "#28a745" }
  };

  // Funkcija za ciklično posodabljanje sprayStatus (0 → 1 → 2 → 0)
  const handleSprayButtonClick = (cellId, article) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const currentStatus = article.sprayStatus || 0;
    const nextStatus = (currentStatus + 1) % 3;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? {
            ...item,
            sprayStatus: nextStatus,
            houseStatus: 0, // Ponastavimo hiško
            cartStatus: 0,  // Ponastavimo košarico
            lastModified: getTodayDate(),
          }
        : item
    );
    const updatedOrder = { ...currentOrder, create_product_realization_list: updatedList };
    dispatch(updateWorkOrder(updatedOrder));
  };

  useEffect(() => {
    console.log("Osvežujem naročila iz baze");
    dispatch(getAllWorkOrders());
  }, [dispatch, location]);

  useEffect(() => {
    if (modalData.open && modalData.orderId && modalData.sector) {
      const currentOrder = orders.find(
        (o) => o._id === modalData.orderId || o.mk_id === modalData.orderId
      );
      if (currentOrder) {
        const sectorProducts = currentOrder.create_product_realization_list.filter(
          (item) => item.sector === modalData.sector
        );
        setModalData((prev) => ({
          ...prev,
          products: sectorProducts,
        }));
      }
    }
  }, [orders, modalData.open, modalData.orderId, modalData.sector]);

const orderedWorkOrders = [...orders]
  .filter(o => {
    const status = (o.ready || "").trim();
    return showCompleted
      ? status === "Zaključeno"
      : status !== "Zaključeno";
  })
  .sort((a, b) => {
    if (a.ready === "Zaključeno" && b.ready !== "Zaključeno") return 1;
    if (a.ready !== "Zaključeno" && b.ready === "Zaključeno") return -1;
    const aDeadline = a.deadline || a.produce_deadline_date || "";
    const bDeadline = b.deadline || b.produce_deadline_date || "";
    return aDeadline.localeCompare(bDeadline);
  });


  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const foundOrder = orders.find(
      (order) =>
        (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.partner?.customer &&
          order.partner.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.count_code && order.count_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (foundOrder) {
      setHighlightedOrder(foundOrder._id || foundOrder.mk_id);
      setTimeout(() => {
        const element = document.getElementById(
          `WorkOrder-${foundOrder._id || foundOrder.mk_id}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else {
      setHighlightedOrder(null);
    }
  };
const handleTypeChange = (order, newType) => {
  const updatedOrder = {
    ...order,
    montaza: newType === "montaza",
    prevzem: newType === "prevzem",
    dostava: newType === "dostava"
  };
  dispatch(updateWorkOrderThunk(updatedOrder));
};

  const openModal = (order, sector) => {
    setHasChanges(false);
    const allProducts = order.create_product_realization_list || [];
    const sectorProducts = allProducts.filter((item) => item.sector === sector);
    const initialFinishedStatus = sectorProducts.reduce((acc, item) => {
      acc[item.cellId] = !!item.finished;
      return acc;
    }, {});
    const initialOrderedStatus = sectorProducts.reduce((acc, item) => {
      acc[item.cellId] = !!item.ordered;
      return acc;
    }, {});
    const initialReceivedStatus = sectorProducts.reduce((acc, item) => {
      acc[item.cellId] = !!item.received;
      return acc;
    }, {});
    setModalData({
      open: true,
      orderId: order._id || order.mk_id,
      sector,
      products: sectorProducts,
      finishedStatus: initialFinishedStatus,
      orderedStatus: initialOrderedStatus,
      receivedStatus: initialReceivedStatus,
    });
  };

  const closeModal = () => {
    const currentOrder = orders.find(
      (o) => o._id === modalData.orderId || o.mk_id === modalData.orderId
    );
    if (hasChanges && currentOrder) {
      dispatch(updateWorkOrderThunk(currentOrder));
    }
    setModalData({
      open: false,
      orderId: null,
      sector: null,
      products: [],
      finishedStatus: {},
      orderedStatus: {},
      receivedStatus: {},
    });
    setEditingProductId(null);
    setEditedProduct({});
    setHasChanges(false);
  };

  const closeOrderDetails = () => {
    const currentOrder = orders.find(
      (o) =>
        o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
    );
    if (hasChanges && currentOrder) {
      dispatch(updateWorkOrderThunk(currentOrder));
    }
    setOrderDetailsModal({ open: false, orderId: null });
    setEditingProductId(null);
    setEditedProduct({});
    setHasChanges(false);
  };

  const openOrderDetails = (order) => {
    setHasChanges(false);
    setOrderDetailsModal({ open: true, orderId: order._id || order.mk_id });
  };

  const orderDetails = useSelector((state) =>
    state.workOrders.orders.find(
      (o) =>
        o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
    )
  );

const handleReadyClick = (orderId) => {
  setConfirmModal({ open: true, orderId });
};

const handleDeleteWorkOrder = async (orderId) => {
  if (!window.confirm("Si prepričan, da želiš IZBRISATI ta delovni nalog?")) return;
  try {
    await dispatch(deleteWorkOrderThunk(orderId));
    // dispatch(getAllWorkOrders()); // po potrebi
  } catch (err) {
    alert("Napaka pri brisanju naloga!");
  }
};

const confirmReady = () => {
  const orderId = confirmModal.orderId;
  const currentOrder = orders.find(
    (o) => o._id === orderId || o.mk_id === orderId
  );
  if (!currentOrder) return;
  const updatedOrder = {
    ...currentOrder,
    ready: "Zaključeno",
    workshopCompleted: true,
    readyForMontaza: true,
  };
  dispatch(updateWorkOrderThunk(updatedOrder));
  setConfirmModal({ open: false, orderId: null }); // zapre modal
};

  const handleResetReady = (orderId) => {
    const currentOrder = orders.find(
      (o) => o._id === orderId || o.mk_id === orderId
    );
    if (!currentOrder) return;
    const updatedOrder = {
      ...currentOrder,
      ready: "",
      workshopCompleted: false,
      readyForMontaza: false,
    };
    dispatch(updateWorkOrderThunk(updatedOrder));
  };

  // Ob kliku na hiško ponastavimo še košarico in spray
  const handleHouseButtonClick = (cellId, article) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const currentStatus = article.houseStatus || 0;
    const nextStatus = (currentStatus + 1) % 3;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? {
            ...item,
            houseStatus: nextStatus,
            cartStatus: 0,
            sprayStatus: 0,
            lastModified: getTodayDate(),
          }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  // Ob kliku na košarico ponastavimo še hiško in spray
  const handleShoppingCartButtonClick = (cellId, article) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const currentStatus = article.cartStatus || 0;
    const nextStatus = (currentStatus + 1) % 3;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? {
            ...item,
            cartStatus: nextStatus,
            houseStatus: 0,
            sprayStatus: 0,
            lastModified: getTodayDate(),
          }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  const updateLastModifiedForArticleWithDate = (cellId, newDate) => {
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId ? { ...item, lastModified: newDate } : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
    setDatePickerOpen((prev) => ({ ...prev, [cellId]: false }));
  };

  const handleDateChange = (cellId, event) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const parts = dateValue.split("-");
      const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
      updateLastModifiedForArticleWithDate(cellId, formattedDate);
    }
  };

  const toggleDatePicker = (cellId) => {
    setDatePickerOpen((prev) => ({ ...prev, [cellId]: !prev[cellId] }));
  };

  const openNoteModal = (cellId) => {
  let existingNote = "";
  if (modalData.open) {
    const currentProduct = modalData.products.find((item) => item.cellId === cellId);
    existingNote = currentProduct ? currentProduct.noteText || "" : "";
  } else if (orderDetailsModal.open) {
    const order = orders.find(
      (o) => o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
    );
    const currentProduct = order?.create_product_realization_list.find((item) => item.cellId === cellId);
    existingNote = currentProduct ? currentProduct.noteText || "" : "";
  }
  setNoteModalData({
    open: true,
    productCellId: cellId,
    note: existingNote,
  });
};

  const closeNoteModal = () => {
    setNoteModalData({ open: false, productCellId: null, note: "" });
  };

  const handleNoteChange = (e) => {
    setNoteModalData((prev) => ({ ...prev, note: e.target.value }));
  };

  const saveNoteModal = () => {
  setHasChanges(true);
  const { productCellId, note } = noteModalData;
  const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
  const currentOrder = orders.find(
    (o) => o._id === currentOrderId || o.mk_id === currentOrderId
  );
  if (currentOrder) {
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === productCellId
        ? { ...item, noteProvided: note.trim() !== "", noteText: note }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    // --> Pomembno: počakamo da je sprememba na serverju narejena
    dispatch(updateWorkOrderThunk(updatedOrder)).then(() => {
      // Če smo v orderDetailsModal (modalu za VSE artikle), še 1x pokliči getAllWorkOrders (osveži iz serverja)
      if (orderDetailsModal.open) {
        dispatch(getAllWorkOrders());
      }
    });

    // Če smo v sector-modal, samo lokalno update-amo products za hiter prikaz
    if (modalData.orderId) {
      setModalData((prevModal) => {
        const newProducts = prevModal.products.map((item) =>
          item.cellId === productCellId
            ? { ...item, noteProvided: note.trim() !== "", noteText: note }
            : item
        );
        return { ...prevModal, products: newProducts };
      });
    }
  }
  closeNoteModal();
};

  const handleEditClick = (prod) => {
    setEditingProductId(prod.cellId);
    setEditedProduct({
      product_code: prod.product_code,
      product_title: prod.product_title,
      notes: prod.notes || prod.product_workorder_desc || "",
      amount_plan: prod.amount_plan,
      sector: prod.sector,
      unit: prod.unit,
    });
  };

  const handleSaveEdit = () => {
    setHasChanges(true);
    let currentOrder;
    if (modalData.open) {
      currentOrder = orders.find(
        (o) => o._id === modalData.orderId || o.mk_id === modalData.orderId
      );
    } else if (orderDetailsModal.open) {
      currentOrder = orders.find(
        (o) => o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
      );
    }
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === editingProductId
        ? {
            ...item,
            product_code: editedProduct.product_code,
            product_title: editedProduct.product_title,
            notes: editedProduct.notes,
            amount_plan: editedProduct.amount_plan,
            sector: editedProduct.sector,
            unit: editedProduct.unit,
          }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
    setEditingProductId(null);
    setEditedProduct({});
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedProduct({});
  };

  const finishArticle = (cellId) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? { ...item, finished: true, lastModified: getTodayDate() }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  const resetNote = (cellId) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? { ...item, noteProvided: false, noteText: "" }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrderThunk(updatedOrder));
  };

  const resetNoteDetails = (cellId) => {
    setHasChanges(true);
    const currentOrderId = orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId
        ? { ...item, noteProvided: false, noteText: "" }
        : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  const resetFinished = (cellId) => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId || orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId ? { ...item, finished: false } : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  const resetFinishedDetails = (cellId) => {
    setHasChanges(true);
    const currentOrderId = orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId ? { ...item, finished: false } : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  // Gumb "Zaključi sektor": če so vsi artikli v sektorju zaključeni, to stanje ima prednost
  const finishSector = () => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedCompleted = currentOrder.completed ? [...currentOrder.completed] : [];
    if (!updatedCompleted.includes(modalData.sector)) {
      updatedCompleted.push(modalData.sector);
    }
    const updatedUserNotesBySector = { ...(currentOrder.userNotesBySector || {}) };
    delete updatedUserNotesBySector[modalData.sector];
    const updatedOrder = {
      ...currentOrder,
      completed: updatedCompleted,
      userNotesBySector: updatedUserNotesBySector,
    };
    dispatch(updateWorkOrder(updatedOrder));
    closeModal();
  };

  const addUserNoteSector = () => {
    setHasChanges(true);
    const currentOrderId = modalData.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedOrder = {
      ...currentOrder,
      userNotesBySector: {
        ...(currentOrder.userNotesBySector || {}),
        [modalData.sector]: true,
      },
    };
    dispatch(updateWorkOrder(updatedOrder));
    closeModal();
  };

  const finishArticleDetails = (cellId) => {
    setHasChanges(true);
    const currentOrderId = orderDetailsModal.orderId;
    const currentOrder = orders.find(
      (o) => o._id === currentOrderId || o.mk_id === currentOrderId
    );
    if (!currentOrder) return;
    const updatedList = currentOrder.create_product_realization_list.map((item) =>
      item.cellId === cellId ? { ...item, finished: true } : item
    );
    const updatedOrder = {
      ...currentOrder,
      create_product_realization_list: updatedList,
    };
    dispatch(updateWorkOrder(updatedOrder));
  };

  return (
    <div className="page workshop-container">
      <h1>DELAVNICA - OBDELAVA STEKLA</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="VNESITE ID NALOGA ALI IME STRANKE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>
      <div className="excel-table">
        {/* ——— filter gumbi ——— */}
<div className="filter-buttons">
  <button
    className={`filter-btn ${!showCompleted ? 'active' : ''}`}
    onClick={() => {
      window.location.reload();
    }}
  >
    Aktivni
  </button>
  <button
     className={`filter-btn completed-btn ${showCompleted ? 'active' : ''}`}
     onClick={() => setShowCompleted(true)}
   >
    Zaključeni
  </button>
</div>

        <div className="table-header">
          <div className="table-cell header empty"></div>
          {allSectors.map((sector) => (
            <div
              key={sector}
              className="table-cell header"
              style={{ backgroundColor: sectorData[sector]?.color, color: "#000" }}
            >
              {sectorData[sector]?.icon} {sector}
            </div>
          ))}
          <div className="table-cell header deadline-header">ROK IZDELAVE</div>
          <div className="table-cell header ready-header">
            PRIPRAVLJENO ZA MONTAŽO/PREVZEM
          </div>
        </div>
        {orderedWorkOrders.length === 0 ? (
          <div className="no-work-orders">Osveževanje podatkov</div>
        ) : (
          <FlipMove duration={500} easing="ease-out">
            {orderedWorkOrders.map((currentOrder) => (
              <div
                key={currentOrder._id || currentOrder.mk_id}
                id={`WorkOrder-${currentOrder._id || currentOrder.mk_id}`}
                className={`row-wrapper ${
                  highlightedOrder === (currentOrder._id || currentOrder.mk_id)
                    ? "highlighted-row"
                    : ""
                } ${currentOrder.ready === "Zaključeno" ? "no-transform" : ""}`}
              >
                <div className="table-row">
                  <div
                    className="table-cell name clickable"
                    onClick={() => openOrderDetails(currentOrder)}
                  >
                    {currentOrder.partner?.customer ||
                      currentOrder.customer ||
                      "NI PODATKA"}
                  </div>
                  {allSectors.map((sector) => {
                    let cellClass = "table-cell";
                    let cellContent = "";
                    let cellStyle = {};
                    const articlesInSector = currentOrder.create_product_realization_list
                      ? currentOrder.create_product_realization_list.filter(
                          (i) => i.sector === sector
                        )
                      : [];

                    // 1. Če so vsi artikli v sektorju zaključeni (ali je sektor že označen kot zaključen)
                    const allFinished =
                      articlesInSector.length > 0 &&
                      articlesInSector.every((i) => i.finished);
                    if (
                      allFinished ||
                      (currentOrder.completed &&
                        currentOrder.completed.includes(sector))
                    ) {
                      cellClass += " completed";
                      cellStyle = { backgroundColor: "green" };
                      cellContent = <FaCheck />;
                    } else {
                      // Izračun statusov za hiško in košarico
                      const houseStatuses = articlesInSector.map((i) => i.houseStatus || 0);
                      const cartStatuses = articlesInSector.map((i) => i.cartStatus || 0);
                      const anyHouse1 = houseStatuses.some((s) => s === 1);
                      const anyCart1 = cartStatuses.some((s) => s === 1);
                      const anyHouse2 = houseStatuses.some((s) => s === 2);
                      const anyCart2 = cartStatuses.some((s) => s === 2);
                      
                      if (anyHouse1 || anyCart1) {
                        // Če je katerikoli status nastavljen na 1 -> oranžna barva
                        cellStyle = { backgroundColor: "orange" };
                        cellClass += " status-updated";
                        cellContent = (
                          <>
                            {anyHouse1 && <FaHome />}
                            {anyCart1 && <FaShoppingCart />}
                          </>
                        );
                      } else if ((anyHouse2 || anyCart2) && !(anyHouse1 || anyCart1)) {
                        // Če nobeden nima statusa 1 in vsaj eden ima 2 -> svetlo zelena
                        cellStyle = { backgroundColor: "lightgreen" };
                        cellClass += " status-updated";
                        cellContent = (
                          <>
                            {anyHouse2 && <FaHome />}
                            {anyCart2 && <FaShoppingCart />}
                          </>
                        );
                      } else {
                        // Ostali pogoji: sprayStatus, prejeto, opomba, naročeno, čakanje, ipd.
                        const sprayArticle = articlesInSector.find(
                          (i) => i.sprayStatus && i.sprayStatus !== 0
                        );
                        if (sprayArticle) {
                          cellClass += " spray-status";
                          cellStyle = { backgroundColor: "#add8e6" };
                          cellContent =
                            sprayArticle.sprayStatus === 1
                              ? "v Barvanju"
                              : "Pobarvano";
                        } else {
                          const anyReceived = articlesInSector.some((i) => i.received);
                          if (anyReceived) {
                            cellClass += " received";
                            cellContent = (
                              <>
                                <FaTruck /> <FaCheck />
                              </>
                            );
                          } else {
                            const hasNote = articlesInSector.some((i) => i.noteProvided);
                            if (hasNote) {
                              cellClass += " user-note-cell";
                              cellContent = <FaStickyNote />;
                            } else if (
                              articlesInSector.length > 0 &&
                              articlesInSector.every((i) => i.ordered)
                            ) {
                              cellClass += " ordered";
                              cellContent = <FaTruck />;
                            } else if (
                              currentOrder.path &&
                              currentOrder.path.includes(sector)
                            ) {
                              cellClass += " waiting";
                            } else {
                              cellClass += " skipped";
                            }
                          }
                        }
                      }
                    }
                    return (
                      <div
                        key={sector}
                        className={cellClass + " clickable"}
                        onClick={() => openModal(currentOrder, sector)}
                        style={cellStyle}
                      >
                        {cellContent}
                      </div>
                    );
                  })}
                  <div className="table-cell deadline-cell">
<div>
  {formatDateTime(currentOrder.deadline || currentOrder.produce_deadline_date)}
</div>
<div className="montaza-prevzem-label">
<select
  value={
    currentOrder.montaza
      ? "montaza"
      : currentOrder.prevzem
      ? "prevzem"
      : currentOrder.dostava
      ? "dostava"
      : ""
  }
  onChange={e => handleTypeChange(currentOrder, e.target.value)}
  style={{ borderRadius: "4px", padding: "2px 8px", marginTop: "2px", fontSize: "0.98em" }}
>
  <option value="montaza">MONTAŽA</option>
  <option value="prevzem">PREVZEM</option>
  <option value="dostava">DOSTAVA</option>
</select>
</div>

                  </div>
                  <div
                    className={`table-cell ready-cell ${
                      currentOrder.ready === "Zaključeno" ? "ready-completed" : ""
                    }`}
                  >
                    {currentOrder.ready === "Zaključeno" ? (
                      <div className="button-group">
                        <span className="ready-completed-label">
                          ZAKLJUČENO
                        </span>
                        <button
                          className="reset-ready-btn"
                          onClick={() =>
                            handleResetReady(
                              currentOrder._id || currentOrder.mk_id
                            )
                          }
                        >
                          <FaTimes />
                        </button>
                              <button
        className="delete-workorder-btn"
        onClick={() =>
          handleDeleteWorkOrder(currentOrder._id || currentOrder.mk_id)
        }
        title="Izbriši delovni nalog"
      >
        <FaTrash />
      </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="ready-button"
                          onClick={() =>
                            handleReadyClick(
                              currentOrder._id || currentOrder.mk_id
                            )
                          }
                        >
                          ZAKLJUČI
                        </button>
                        <button
                          className="reset-ready-btn"
                          onClick={() =>
                            handleResetReady(
                              currentOrder._id || currentOrder.mk_id
                            )
                          }
                        >
                          <FaTimes />
                        </button>
                          <button
    className="delete-workorder-btn"
    onClick={() =>
      handleDeleteWorkOrder(
        currentOrder._id || currentOrder.mk_id
      )
    }
  >
    <FaTrash />
  </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </FlipMove>
        )}
      </div>

      {/* Modal – artikli v izbranem sektorju */}
      {modalData.open && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal ${editingProductId ? "modal-fullscreen" : ""}`}>
            <div className="modal-header">
              <div className="order-info">
                <p>
                  <strong>ŠT. NALOGA:</strong>{" "}
                  {orders.find(
                    (o) =>
                      o._id === modalData.orderId || o.mk_id === modalData.orderId
                  )?.count_code || "NI PODATKA"}
                </p>
                <p className="montaza-prevzem-label">
                  {getMontazaOrPrevzemLabel(
                    orders.find(
                      (o) =>
                        o._id === modalData.orderId || o.mk_id === modalData.orderId
                    )
                  ) || ""}
                </p>
                  <p>
    <strong>Skrbnik:</strong>{" "}
    {
      orders.find(
        (o) =>
          o._id === modalData.orderId || o.mk_id === modalData.orderId
      )?.caretaker_list?.[0]?.count_code || "NI PODATKA"
    }
  </p>
              </div>
              <button className="close-button" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <h4>SEKTORJI IN ARTIKLI</h4>
              <p>
                <strong>Dodatna navodila:</strong>{" "}
                {orders.find(
                  (o) =>
                    o._id === modalData.orderId || o.mk_id === modalData.orderId
                )?.additionalInstructions || "Ni navodil"}
              </p>
              {modalData.products.length > 0 ? (
                <>
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th className="edit-column"></th>
                        <th>SEKTOR</th>
                        <th>KODA</th>
                        <th>ARTIKEL</th>
                        <th className="col-dodatni-opis">OPIS</th>
                        <th>KOLIČINA</th>
                        <th className="note-col">OPOMBA</th>
                        <th className="col-naroci-prejeto">GUMBI</th>
                        <th className="status-col">STATUS</th>
                        <th className="last-modified-col">ZADNJA SPREMEMBA</th>
                        <th>ZAKLJUČI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.products.map((prod) => (
                        <tr key={prod.cellId} className={editingProductId === prod.cellId ? "editing-row" : ""}>
                          <td className="edit-column">
                            {editingProductId === prod.cellId ? (
                              <div className="button-group">
                                <button className="save-edit-btn" onClick={handleSaveEdit}>
                                  <FaCheck />
                                </button>
                                <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <button className="edit-btn" onClick={() => handleEditClick(prod)}>
                                <FaPencilAlt />
                              </button>
                            )}
                          </td>
                          <td
                            className="editable-col"
                            style={{
                              backgroundColor: editingProductId === prod.cellId
                                ? (sectorData[editedProduct.sector]?.color || "transparent")
                                : (sectorData[prod.sector]?.color || "transparent")
                            }}
                          >
                            {editingProductId === prod.cellId ? (
                              <select
                                value={editedProduct.sector || prod.sector}
                                onChange={(e) => setEditedProduct({ ...editedProduct, sector: e.target.value })}
                              >
                                {allSectors.map((sec) => (
                                  <option key={sec} value={sec}>
                                    {sec}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              prod.sector || "-"
                            )}
                          </td>
                          <td className="editable-col">
                            {editingProductId === prod.cellId ? (
                              <input
                                type="text"
                                value={editedProduct.product_code || ""}
                                onChange={(e) =>
                                  setEditedProduct({ ...editedProduct, product_code: e.target.value })
                                }
                              />
                            ) : (
                              removeNewlines(prod.product_code)
                            )}
                          </td>
                          <td className="editable-col">
                            {editingProductId === prod.cellId ? (
                              <input
                                type="text"
                                value={editedProduct.product_title || ""}
                                onChange={(e) =>
                                  setEditedProduct({ ...editedProduct, product_title: e.target.value })
                                }
                              />
                            ) : (
                              removeNewlines(prod.product_title)
                            )}
                          </td>
                          <td className="editable-col col-dodatni-opis">
                            {editingProductId === prod.cellId ? (
                              <input
                                type="text"
                                value={editedProduct.notes || ""}
                                onChange={(e) =>
                                  setEditedProduct({ ...editedProduct, notes: e.target.value })
                                }
                              />
                            ) : (
                              <span className="red-text">
                                {removeNewlines(prod.notes) ||
                                  removeNewlines(prod.product_workorder_desc) ||
                                  "-"}
                              </span>
                            )}
                          </td>
                          <td className="col-kolicina">
                            {editingProductId === prod.cellId ? (
                              <input
                                type="number"
                                value={editedProduct.amount_plan || ""}
                                onChange={(e) =>
                                  setEditedProduct({ ...editedProduct, amount_plan: e.target.value })
                                }
                              />
                            ) : (
                              removeNewlines(prod.amount_plan) + " " + (prod.unit || "")
                            )}
                          </td>
                          <td className={`note-col ${prod.noteProvided ? "note-provided-cell" : ""}`}>
                            <div className="button-group">
                              <button className="note-button" onClick={() => openNoteModal(prod.cellId)}>
                                <FaStickyNote />
                              </button>
                              <button className="reset-article-btn" onClick={() => resetNote(prod.cellId)}>
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                          <td className="order-received-column col-naroci-prejeto">
                            <div className="button-group">
                              <button
                                className="custom-house-btn"
                                onClick={() => handleHouseButtonClick(prod.cellId, prod)}
                                style={{ backgroundColor: getHouseButtonColor(prod) }}
                                id={`${modalData.orderId || ""}-${prod.product_code || ""}-${prod.cellId}`}
                              >
                                <FaHome />
                              </button>
                             <button
  className="custom-shopping-cart-btn"
  onClick={() => handleShoppingCartButtonClick(prod.cellId, prod)}
  style={{ backgroundColor: getCartButtonColor(prod) }}
>
  <FaShoppingCart />
</button>
                              <button
                                className="custom-spray-btn"
                                onClick={() => handleSprayButtonClick(prod.cellId, prod)}
                                style={{ backgroundColor: getSprayButtonColor(prod) }}
                              >
                                <FaPaintRoller />
                              </button>
                            </div>
                          </td>
                          <td
                            className="status-col"
                            style={{
                              backgroundColor: getStatusForCell(prod).bg,
                              color: "black",
                              textAlign: "center",
                            }}
                          >
                            {getStatusForCell(prod).text}
                          </td>
                          <td className="last-modified-col">
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                              <span>{prod.lastModified || ""}</span>
                              <button className="calendar-button" onClick={() => toggleDatePicker(prod.cellId)}>
                                <FaCalendarAlt />
                              </button>
                              {datePickerOpen[prod.cellId] && (
                                <input
                                  type="date"
                                  onChange={(e) => handleDateChange(prod.cellId, e)}
                                  onBlur={() => toggleDatePicker(prod.cellId)}
                                />
                              )}
                            </div>
                          </td>
                          <td className={`col-zakljuci ${prod.finished ? "finish-cell-green" : ""}`}>
                            <div className="button-group">
                              {editingProductId === prod.cellId ? (
                                <>
                                  <button className="finish-article-btn-green" onClick={() => finishArticleDetails(prod.cellId)}>
                                    <FaCheck />
                                  </button>
                                  <button className="reset-article-btn" onClick={() => resetFinished(prod.cellId)}>
                                    <FaTimes />
                                  </button>
                                </>
                              ) : prod.finished ? (
                                <>
                                  <span className="finished-indicator">DONE</span>
                                  <button className="reset-article-btn" onClick={() => resetFinished(prod.cellId)}>
                                    <FaTimes />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="finish-article-btn-green" onClick={() => finishArticle(prod.cellId)}>
                                    <FaCheck />
                                  </button>
                                  <button className="reset-article-btn" onClick={() => resetFinished(prod.cellId)}>
                                    <FaTimes />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="modal-footer">
                    <button className="finish-button" onClick={finishSector}>
                      ZAKLJUČI SEKTOR
                    </button>
                    <button className="add-note-button" onClick={addUserNoteSector}>
                      DODAJ OPOMBA - ČAKAM
                    </button>
                    <button className="close-footer-button" onClick={closeModal}>
                      ZAPRI
                    </button>
                  </div>
                </>
              ) : (
                <p className="no-products">NI ARTIKLOV.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal – podrobnosti naročila */}
      {orderDetailsModal.open && (
        <div className="custom-modal-overlay">
          <div className={`custom-modal order-details-modal ${editingProductId ? "modal-fullscreen" : ""}`}>
            <div className="modal-header">
              <div className="order-info">
                <p>
                  <strong>ŠT. NALOGA:</strong>{" "}
                  {orders.find(
                    (o) =>
                      o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
                  )?.count_code || "NI PODATKA"}
                </p>
                <p className="montaza-prevzem-label">
                  {getMontazaOrPrevzemLabel(
                    orders.find(
                      (o) =>
                        o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
                    )
                  ) || ""}
                </p>
                  <p>
    <strong>Skrbnik:</strong>{" "}
    {
      orders.find(
        (o) =>
          o._id === orderDetailsModal.orderId || o.mk_id === orderDetailsModal.orderId
      )?.caretaker_list?.[0]?.count_code || "NI PODATKA"
    }
  </p>
              </div>
              <button className="close-button" onClick={closeOrderDetails}>
                <FaTimes />
              </button>
            </div>
            {orderDetails ? (
              <div className="order-details-content">
                <p>
                  <strong>STRANKA:</strong>{" "}
                  {orderDetails.partner?.customer ||
                    orderDetails.customer ||
                    "NI PODATKA"}
                </p>
                <h4>SEKTORJI IN ARTIKLI</h4>
                <p>
                  <strong>Dodatna navodila:</strong>{" "}
                  {orderDetails.additionalInstructions || "Ni navodil"}
                </p>
                {orderDetails.create_product_realization_list &&
                orderDetails.create_product_realization_list.length > 0 ? (
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th className="edit-column"></th>
                        <th>SEKTOR</th>
                        <th>KODA</th>
                        <th>ARTIKEL</th>
                        <th className="col-dodatni-opis">OPIS</th>
                        <th>KOLIČINA</th>
                        <th className="note-col">OPOMBA</th>
                        <th className="col-naroci-prejeto">GUMBI</th>
                        <th className="status-col">STATUS</th>
                        <th className="last-modified-col">ZADNJA SPREMEMBA</th>
                        <th>ZAKLJUČI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.create_product_realization_list.map((item) => (
                          <tr key={item.cellId} className={editingProductId === item.cellId ? "editing-row" : ""}>
                            <td className="edit-column">
                              {editingProductId === item.cellId ? (
                                <div className="button-group">
                                  <button className="save-edit-btn" onClick={handleSaveEdit}>
                                    <FaCheck />
                                  </button>
                                  <button className="cancel-edit-btn" onClick={handleCancelEdit}>
                                    <FaTimes />
                                  </button>
                                </div>
                              ) : (
                                <button className="edit-btn" onClick={() => handleEditClick(item)}>
                                  <FaPencilAlt />
                                </button>
                              )}
                            </td>
                            <td
                              className="editable-col"
                              style={{
                                backgroundColor: editingProductId === item.cellId
                                  ? sectorData[editedProduct.sector]?.color || "transparent"
                                  : sectorData[item.sector]?.color || "transparent",
                              }}
                            >
                              {editingProductId === item.cellId ? (
                                <select value={editedProduct.sector || item.sector} onChange={(e) => setEditedProduct({ ...editedProduct, sector: e.target.value })}>
                                  {allSectors.map((sec) => (
                                    <option key={sec} value={sec}>
                                      {sec}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                item.sector || "-"
                              )}
                            </td>
                            <td className="editable-col">
                              {editingProductId === item.cellId ? (
                                <input type="text" value={editedProduct.product_code || ""} onChange={(e) => setEditedProduct({ ...editedProduct, product_code: e.target.value })} />
                              ) : (
                                removeNewlines(item.product_code)
                              )}
                            </td>
                            <td className="editable-col">
                              {editingProductId === item.cellId ? (
                                <input type="text" value={editedProduct.product_title || ""} onChange={(e) => setEditedProduct({ ...editedProduct, product_title: e.target.value })} />
                              ) : (
                                removeNewlines(item.product_title)
                              )}
                            </td>
                            <td className="editable-col col-dodatni-opis">
                              {editingProductId === item.cellId ? (
                                <input type="text" value={editedProduct.notes || ""} onChange={(e) => setEditedProduct({ ...editedProduct, notes: e.target.value })} />
                              ) : (
                                <span className="red-text">
                                  {removeNewlines(item.notes) || removeNewlines(item.product_workorder_desc) || "-"}
                                </span>
                              )}
                            </td>
                            <td className="col-kolicina">
                              {editingProductId === item.cellId ? (
                                <input type="number" value={editedProduct.amount_plan || ""} onChange={(e) => setEditedProduct({ ...editedProduct, amount_plan: e.target.value })} />
                              ) : (
                                removeNewlines(item.amount_plan) + " " + (item.unit || "")
                              )}
                            </td>
                            <td className={`note-col ${item.noteProvided ? "note-provided-cell" : ""}`}>
                              <div className="button-group">
                                <button className="note-button" onClick={() => openNoteModal(item.cellId)}>
                                  <FaStickyNote />
                                </button>
                                <button className="reset-article-btn" onClick={() => resetNoteDetails(item.cellId)}>
                                  <FaTimes />
                                </button>
                              </div>
                            </td>
                            <td className="order-received-column col-naroci-prejeto">
                              <div className="button-group">
                                <button
                                  className="custom-house-btn"
                                  onClick={() => handleHouseButtonClick(item.cellId, item)}
                                  style={{ backgroundColor: getHouseButtonColor(item) }}
                                  id={`${orderDetails?._id || ""}-${item.product_code || ""}-${item.cellId}`}
                                >
                                  <FaHome />
                                </button>
                                <button
  className="custom-shopping-cart-btn"
  onClick={() => handleShoppingCartButtonClick(item.cellId, item)}
  style={{ backgroundColor: getCartButtonColor(item) }}
>
  <FaShoppingCart />
</button>
                                <button
                                  className="custom-spray-btn"
                                  onClick={() => handleSprayButtonClick(item.cellId, item)}
                                  style={{ backgroundColor: getSprayButtonColor(item) }}
                                >
                                  <FaPaintRoller />
                                </button>
                              </div>
                            </td>
                            <td
                              className="status-col"
                              style={{
                                backgroundColor: getStatusForCell(item).bg,
                                color: "black",
                                textAlign: "center",
                              }}
                            >
                              {getStatusForCell(item).text}
                            </td>
                            <td className="last-modified-col">
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                                <span>{item.lastModified || ""}</span>
                                <button className="calendar-button" onClick={() => toggleDatePicker(item.cellId)}>
                                  <FaCalendarAlt />
                                </button>
                                {datePickerOpen[item.cellId] && (
                                  <input
                                    type="date"
                                    onChange={(e) => handleDateChange(item.cellId, e)}
                                    onBlur={() => toggleDatePicker(item.cellId)}
                                  />
                                )}
                              </div>
                            </td>
                            <td className={`col-zakljuci ${item.finished ? "finish-cell-green" : ""}`}>
                              <div className="button-group">
                                {editingProductId === item.cellId ? (
                                  <>
                                    <button className="finish-article-btn-green" onClick={() => finishArticleDetails(item.cellId)}>
                                      <FaCheck />
                                    </button>
                                    <button className="reset-article-btn" onClick={() => resetFinishedDetails(item.cellId)}>
                                      <FaTimes />
                                    </button>
                                  </>
                                ) : item.finished ? (
                                  <>
                                    <span className="finished-indicator">DONE</span>
                                    <button className="reset-article-btn" onClick={() => resetFinishedDetails(item.cellId)}>
                                      <FaTimes />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="finish-article-btn-green" onClick={() => finishArticle(item.cellId)}>
                                      <FaCheck />
                                    </button>
                                    <button className="reset-article-btn" onClick={() => resetFinished(item.cellId)}>
                                      <FaTimes />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-products">NI ARTIKLOV.</p>
                )}
                <button onClick={closeOrderDetails}>ZAPRI</button>
              </div>
            ) : (
              <p>NI PODATKOV ZA TO NAROČILO.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal za dodajanje opombe */}
      {noteModalData.open && (
        <div className="note-modal-overlay">
          <div className="note-modal">
            <div className="modal-header">
              <h2>VNESI OPOMBA</h2>
              <button className="close-button" onClick={closeNoteModal}>
                <FaTimes />
              </button>
            </div>
            <textarea
              value={noteModalData.note}
              onChange={handleNoteChange}
              placeholder="VNESI OPOMBA TUKAJ..."
            ></textarea>
            <div className="modal-buttons">
              <button className="save-button" onClick={saveNoteModal}>
                SHRANI
              </button>
              <button className="cancel-button" onClick={closeNoteModal}>
                PREKLIČI
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal za potrditev zaključka */}
      {confirmModal.open && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h2>Potrditev zaključka</h2>
            <p>Ali res želiš označiti ta nalog kot ZAKLJUČEN?</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={confirmReady}>
                Potrdi
              </button>
              <button
                className="cancel-btn"
                onClick={() => setConfirmModal({ open: false, orderId: null })}
              >
                Prekliči
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal za potrditveno brisanje delovnega naloga */}
      {deleteConfirmModal.open && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>Ali res želiš izbrisati ta delovni nalog?</h3>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="confirm-delete-btn"
                onClick={() => {
                  dispatch(deleteWorkOrderThunk(deleteConfirmModal.orderId));
                  setDeleteConfirmModal({ open: false, orderId: null });
                }}
              >
                Izbriši
              </button>
              <button
                className="cancel-delete-btn"
                onClick={() => setDeleteConfirmModal({ open: false, orderId: null })}
              >
                Prekliči
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workshop;
