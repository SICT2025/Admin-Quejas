// src/components/AdminQuejas.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AdminQuejas.css';

const AdminQuejas = () => {
  const [quejas, setQuejas] = useState([]);
  const [quejaSeleccionada, setQuejaSeleccionada] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');
  const navigate = useNavigate();

  const API_URL = 'https://api-quejas.onrender.com/api/quejas';

  // Proteger acceso si no está logueado
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/login');
    }
  }, [navigate]);

  // Función para cargar quejas desde la API
  const fetchQuejas = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setQuejas(data))
      .catch((err) => console.error('Error al cargar quejas:', err));
  };

  // Cargar quejas al iniciar y cada 10 segundos
  useEffect(() => {
    fetchQuejas(); // carga inicial

    const intervalo = setInterval(() => {
      fetchQuejas(); // carga periódica cada 10 segundos
    }, 10000);

    return () => clearInterval(intervalo); // limpiar intervalo al desmontar
  }, []);

  const seleccionarQueja = (q) => {
    setQuejaSeleccionada(q);
    setNuevoEstatus(q.estatus);
  };

  const actualizarEstatus = () => {
    fetch(`${API_URL}/${quejaSeleccionada.folio}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estatus: nuevoEstatus }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('Estatus actualizado');
        setQuejas((prev) =>
          prev.map((q) =>
            q.folio === quejaSeleccionada.folio
              ? { ...q, estatus: nuevoEstatus }
              : q
          )
        );
        setQuejaSeleccionada(null);
      })
      .catch((err) => console.error('Error al actualizar:', err));
  };

  const cerrarSesion = () => {
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Botón de cerrar sesión */}
      <button
        onClick={cerrarSesion}
        style={{
          float: 'right',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        Cerrar sesión
      </button>

      <h2>Panel de Administración de Quejas</h2>

      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Tipo</th>
            <th>Estatus</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {quejas.map((q) => (
            <tr key={q.folio}>
              <td>{q.folio}</td>
              <td>{q.tipo}</td>
              <td>{q.estatus}</td>
              <td>{new Date(q.fecha).toLocaleString()}</td>
              <td>
                <button onClick={() => seleccionarQueja(q)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {quejaSeleccionada && (
        <div style={{ marginTop: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
          <h3>Editar Queja: {quejaSeleccionada.folio}</h3>
          <p><strong>Tipo:</strong> {quejaSeleccionada.tipo}</p>
          <p><strong>Texto:</strong> {quejaSeleccionada.texto}</p>
          <label>
            Nuevo Estatus:
            <select
              value={nuevoEstatus}
              onChange={(e) => setNuevoEstatus(e.target.value)}
            >
              <option value="Recibida">Recibida</option>
              <option value="En proceso">En proceso</option>
              <option value="Resuelta">Resuelta</option>
            </select>
          </label>
          <br /><br />
          <button onClick={actualizarEstatus}>Guardar</button>
          <button onClick={() => setQuejaSeleccionada(null)} style={{ marginLeft: '1rem' }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminQuejas;