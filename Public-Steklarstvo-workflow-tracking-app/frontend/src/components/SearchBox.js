import React from "react";

const SearchBox = ({ WorkOrderId, setWorkOrderId, fetchWorkOrderById }) => {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Vnesite številko naloga..."
        value={WorkOrderId}
        onChange={(e) => setWorkOrderId(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && fetchWorkOrderById()}
        required
      />
      <button onClick={fetchWorkOrderById}>🔍</button>
    </div>
  );
};

export default SearchBox;
