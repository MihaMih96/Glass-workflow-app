// src/App.js
import React, { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "./components/Header";
import AnimatedRoutes from "./AnimatedRoutes"; // Prilagodi pot, če je datoteka v podmapi
import 'bootstrap/dist/css/bootstrap.min.css';  // Dodan import Bootstrapa
import "./App.css"; // Osnovni stil

function App() {
  return (
    <Router>
      <Header />
      <div className="main-content">
        <Suspense fallback={<div className="loading">🔄 Nalagam stran...</div>}>
          <AnimatedRoutes />
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
