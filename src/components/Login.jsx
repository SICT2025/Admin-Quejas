// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('https://api-quejas.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin'); // Cambiado para redirigir al panel de administración
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-banner">BUZÓN DE QUEJAS - ADMINISTRADOR</div>
      <div className="login-box">
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />

        <div className="password-container">
          <input
            type={mostrarPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrarPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button onClick={handleLogin}>Entrar</button>
      </div>
    </div>
  );
};

export default Login;
