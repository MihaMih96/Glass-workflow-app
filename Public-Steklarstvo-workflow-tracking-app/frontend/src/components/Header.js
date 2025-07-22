import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // Dodaj useNavigate!
import logo from "../assets/logo.png";
import api from "../services/api";
import "./Header.css";

const Header = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate(); // Dodaj za preusmeritev

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get("/api/orders");
        setPendingCount(res.data.filter((o) => o.status !== "ordered").length);
      } catch {
        setPendingCount(0);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  // ---- Gumb za odjavo ----
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <header className="app-header" style={{ position: "relative" }}>
      <div className="header-left">
        <img src={logo} alt="Logo" className="header-logo" />
      </div>
      <nav className="header-nav">
        <ul>
          <li>
            <NavLink to="/" end>Domov</NavLink>
          </li>
          <li>
            <NavLink to="/search">Dodaj - Delovni nalog</NavLink>
          </li>
          <li>
            <NavLink to="/workshop">Delavnica</NavLink>
          </li>
          <li>
            <NavLink to="/terminski-plan">Terminski plan - Montaža</NavLink>
          </li>
          <li>
            <NavLink to="/terminski-plan-prevzem">Terminski plan - Prevzem</NavLink>
          </li>
          <li>
            <NavLink to="/settings">Nastavitve</NavLink>
          </li>
          <li>
            <NavLink to="/orders">
              Naročila{" "}
              {pendingCount > 0 && (
                <span className="order-badge">{pendingCount}</span>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
<button className="logout-btn" onClick={handleLogout}>Odjava</button>
    </header>
  );
};

export default Header;
