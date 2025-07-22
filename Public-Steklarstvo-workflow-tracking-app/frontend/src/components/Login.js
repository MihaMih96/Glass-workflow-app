// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Uvozi Axios instanco iz mape services
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Klic na /api/auth/login, kar bo lokalno preusmerjeno na http://localhost:5000/api/auth/login
      // ali na produkcijo, če je REACT_APP_API_URL nastavljena.
      const response = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
      navigate('/workshop');
    } catch (err) {
      console.error(err);
      setError('Prijava ni uspela. Preveri uporabniško ime in geslo.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Prijava</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Uporabniško ime</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Vnesite uporabniško ime"
              required
            />
          </div>
          <div className="form-group">
            <label>Geslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vnesite geslo"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-button">Prijava</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
