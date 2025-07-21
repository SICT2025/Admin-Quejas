import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Chart } from 'chart.js/auto';
import '../AdminQuejas.css';

const AdminQuejas = () => {
  const [quejas, setQuejas] = useState([]);
  const [quejaSeleccionada, setQuejaSeleccionada] = useState(null);
  const [nuevoEstatus, setNuevoEstatus] = useState('');
  const navigate = useNavigate();

  const chartRef = useRef(null);
  const pdfChartRef = useRef(null);
  const hiddenReporteRef = useRef(null);

  const API_URL = 'https://api-quejas.onrender.com/api/quejas';

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) navigate('/login');
  }, [navigate]);

  const fetchQuejas = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setQuejas(data))
      .catch((err) => console.error('Error al cargar quejas:', err));
  };

  useEffect(() => {
    fetchQuejas();
    const intervalo = setInterval(() => fetchQuejas(), 10000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    const conteo = quejas.reduce((acc, q) => {
      acc[q.tipo] = (acc[q.tipo] || 0) + 1;
      return acc;
    }, {});

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: 'Quejas por categoría',
          data: Object.values(conteo),
          backgroundColor: function(context) {
            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#f7b7d3');
            gradient.addColorStop(1, '#611232');
            return gradient;
          },
          borderRadius: 8,
          borderColor: '#444',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }, [quejas]);

  const renderPdfChart = () => {
    if (!pdfChartRef.current) return;

    const ctx = pdfChartRef.current.getContext('2d');
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    const conteo = quejas.reduce((acc, q) => {
      acc[q.tipo] = (acc[q.tipo] || 0) + 1;
      return acc;
    }, {});

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: 'Quejas por categoría',
          data: Object.values(conteo),
          backgroundColor: function(context) {
            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#f7b7d3');
            gradient.addColorStop(1, '#611232');
            return gradient;
          },
          borderRadius: 8,
          borderColor: '#444',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  };

  const generarReportePDF = async () => {
    renderPdfChart();
    await new Promise((r) => setTimeout(r, 300));

    const input = hiddenReporteRef.current;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('reporte_quejas.pdf');
  };

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '1rem' }}>
        <button
          onClick={generarReportePDF}
          style={{
            background: '#1ba026ff',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Descargar PDF
        </button>
        <button
          onClick={cerrarSesion}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <h2>Panel de Administración de Quejas</h2>

      <canvas ref={chartRef} style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '2rem' }} />

      <table border="1" cellPadding="5" cellSpacing="0" style={{ width: '100%' }}>
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
              <td><button onClick={() => seleccionarQueja(q)}>Editar</button></td>
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

      {/* Contenido oculto para generar el PDF */}
      <div
        ref={hiddenReporteRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          backgroundColor: '#e6d194',
          padding: '20px',
          color: '#212529',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          width: '700px'
        }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Reporte de Quejas</h3>
        <canvas ref={pdfChartRef} width={600} height={300} style={{ marginBottom: '20px' }} />

        <table
          cellPadding="4"
          cellSpacing="0"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #999'
          }}
        >
          <thead>
            <tr>
              {['Folio', 'Tipo', 'Estatus', 'Fecha'].map((header, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '6px',
                    backgroundColor: idx % 2 === 0 ? '#611232' : 'rgba(255, 192, 203, 0.4)',
                    color: idx % 2 === 0 ? 'white' : '#000'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quejas.map((q) => (
              <tr key={q.folio}>
                {[q.folio, q.tipo, q.estatus, new Date(q.fecha).toLocaleString()].map((text, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '6px',
                      backgroundColor: idx % 2 === 0 ? '#611232' : 'rgba(255, 192, 203, 0.4)',
                      color: idx % 2 === 0 ? 'white' : '#000'
                    }}
                  >
                    {text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminQuejas;
 