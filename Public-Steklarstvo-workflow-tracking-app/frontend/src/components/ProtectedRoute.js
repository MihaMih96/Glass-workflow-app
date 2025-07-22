// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  // Če token obstaja, prikaži zaščitene strani (Outlet), sicer preusmeri na /login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
