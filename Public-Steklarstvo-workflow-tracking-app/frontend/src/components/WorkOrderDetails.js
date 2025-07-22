import React from "react";

const WorkOrderDetails = ({ selectedWorkOrder, handleSendToWork }) => {
  if (!selectedWorkOrder) return null;

  return (
    <div className="modal">
      <h2>Podatki o delovnem nalogu</h2>
      <p><strong>ID:</strong> {selectedWorkOrder.doc_id}</p>
      <p><strong>Datum:</strong> {selectedWorkOrder.doc_date}</p>
      <p><strong>Status:</strong> {selectedWorkOrder.status}</p>

      <div className="buttons">
        <button className="cancel">Preklic</button>
        <button className="confirm" onClick={handleSendToWork}>Pošlji v delo</button>
      </div>
    </div>
  );
};

export default WorkOrderDetails;
