// AnimatedRoutes.js
import React, { useMemo, useRef, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Home from "./pages/Home";
import Login from "./components/Login"; // Login ostane dostopen
import Search from "./pages/Search";
import Workshop from "./pages/Workshop";
import Assembly from "./pages/Assembly";
import Settings from "./pages/Settings";
import TerminskiPlan from "./pages/TerminskiPlan";
import TerminskiPlanPrevzem from "./pages/TerminskiPlanPrevzem";
import ProtectedRoute from "./components/ProtectedRoute"; // Uvozi ProtectedRoute
import "./AnimatedRoutes.css";
import Orders from "./pages/Orders";

// Posodobljen vrstni red poti, vključi tudi /login
const routesOrder = {
  "/login": 0,
  "/": 1,
  "/search": 2,
  "/workshop": 3,
  "/assembly": 4,
  "/settings": 5,
  "/terminski-plan": 6,
  "/terminski-plan-prevzem": 7,
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const prevLocationRef = useRef(location);

  const computedDirection = useMemo(() => {
    const prevIndex = routesOrder[prevLocationRef.current.pathname] ?? 0;
    const currentIndex = routesOrder[location.pathname] ?? 0;
    return currentIndex > prevIndex ? "left" : "right";
  }, [location]);

  useEffect(() => {
    prevLocationRef.current = location;
  }, [location]);

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname}
        classNames={computedDirection === "left" ? "page-left" : "page-right"}
        timeout={600}
      >
        <Routes location={location}>
          {/* Pristopna pot za prijavo je odprta */}
          <Route path="/login" element={<Login />} />
          {/* Ostale poti so zaščitene z ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/workshop" element={<Workshop />} />
            <Route path="/assembly" element={<Assembly />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/terminski-plan" element={<TerminskiPlan />} />
            <Route path="/terminski-plan-prevzem" element={<TerminskiPlanPrevzem />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default AnimatedRoutes;
