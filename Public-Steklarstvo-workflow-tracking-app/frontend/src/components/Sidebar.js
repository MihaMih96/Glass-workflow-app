// src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa"; // Hamburger ikona
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Zaprt meni = krog z ikono */}
      <div className="hamburger-icon">
        <FaBars />
      </div>

      {/* Navigacija, prikaže se ob hoveru */}
      <nav className="nav-links">
        <ul>
          <li><Link to="/">Domov</Link></li>
          <li><Link to="/search">Iskanje</Link></li>
          <li><Link to="/workshop">Delavnica</Link></li>
          <li><Link to="/assembly">Montaža</Link></li>
          <li><Link to="/settings">Nastavitve</Link></li>
          <li><Link to="/terminski-plan">Terminski Plan</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
