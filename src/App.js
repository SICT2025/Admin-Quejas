import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminQuejas from './components/AdminQuejas';
import Login from './components/Login';

function App() {
  /**
   * Comprueba si el usuario es administrador según el valor almacenado en localStorage.
   * @returns {boolean} true si es administrador, false en caso contrario.
   */
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  return (
    <Router>
      <Routes>
        {/* Redirige la ruta raíz siempre al login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Ruta para el login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida para el administrador */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <>
                <h1 style={{ textAlign: 'center', marginTop: '1rem' }}>
                  Buzón de Quejas - Administrador
                </h1>
                <AdminQuejas />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Ruta desconocida redirige a la raíz */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;