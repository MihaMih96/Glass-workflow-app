// src/components/LogoutButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username'); // če ga uporabljaš
    navigate('/login'); // ali window.location.href = '/login';
  };

  return (
    <button
      style={{
        position: 'absolute',
        top: 20,
        right: 24,
        background: '#e84c4c',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 18px',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '1em'
      }}
      onClick={handleLogout}
    >
      Odjava
    </button>
  );
};

export default LogoutButton;
