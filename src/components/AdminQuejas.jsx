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
  const [filtroRapido, setFiltroRapido] = useState('mes'); // "mes", "año", "personalizado"
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const navigate = useNavigate();

  const chartRefTipo = useRef(null);
  const chartRefEstatus = useRef(null);
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

  const crearGrafica = (ref, datos, label) => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(datos),
        datasets: [{
          label,
          data: Object.values(datos),
          backgroundColor: function (context) {
            const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#9b2247');
            gradient.addColorStop(1, '#12a319ff');
            return gradient;
          },
          borderRadius: 10,
          borderColor: '#eee',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
            labels: { color: '#000' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#000' },
            grid: { color: '#000' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#000' },
            grid: { color: '#000' }
          }
        }
      }
    });
  };

  useEffect(() => {
    const conteoTipo = quejas.reduce((acc, q) => {
      acc[q.tipo] = (acc[q.tipo] || 0) + 1;
      return acc;
    }, {});
    crearGrafica(chartRefTipo, conteoTipo, 'Quejas por tipo');

    const conteoEstatus = quejas.reduce((acc, q) => {
      acc[q.estatus] = (acc[q.estatus] || 0) + 1;
      return acc;
    }, {});
    crearGrafica(chartRefEstatus, conteoEstatus, 'Quejas por estatus');
  }, [quejas]);

  // NUEVO: Función para obtener fechas según filtro rápido
  const getFechasFiltro = () => {
    const hoy = new Date();
    let inicio, fin;
    if (filtroRapido === "mes") {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = hoy;
    } else if (filtroRapido === "año") {
      inicio = new Date(hoy.getFullYear(), 0, 1);
      fin = hoy;
    } else {
      inicio = fechaInicio ? new Date(fechaInicio) : null;
      fin = fechaFin ? new Date(fechaFin) : null;
    }
    // Ajustar fin para incluir todo el día seleccionado
    if (fin) fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  };

  // NUEVO: Filtrar quejas por fecha
  const getQuejasFiltradas = () => {
    const { inicio, fin } = getFechasFiltro();
    return quejas.filter(q => {
      if (!q.fecha) return false;
      const fechaQ = new Date(q.fecha);
      if (inicio && fechaQ < inicio) return false;
      if (fin && fechaQ > fin) return false;
      return true;
    });
  };

  // Modifica renderPdfChart para usar las quejas filtradas
  const renderPdfChart = (quejasFiltradas) => {
    if (!pdfChartRef.current) return;
    const ctx = pdfChartRef.current.getContext('2d');
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    const conteoTipo = quejasFiltradas.reduce((acc, q) => {
      acc[q.tipo] = (acc[q.tipo] || 0) + 1;
      return acc;
    }, {});

    const conteoEstatus = quejasFiltradas.reduce((acc, q) => {
      acc[q.estatus] = (acc[q.estatus] || 0) + 1;
      return acc;
    }, {});

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [...Object.keys(conteoTipo), ...Object.keys(conteoEstatus)],
        datasets: [
          {
            label: 'Quejas por tipo',
            data: [...Object.values(conteoTipo), ...Array(Object.keys(conteoEstatus).length).fill(0)],
            backgroundColor: '#9b2247',
            borderRadius: 5,
            borderColor: '#eee',
            borderWidth: 1
          },
          {
            label: 'Quejas por estatus',
            data: [...Array(Object.keys(conteoTipo).length).fill(0), ...Object.values(conteoEstatus)],
            backgroundColor: '#12a319ff',
            borderRadius: 5,
            borderColor: '#eee',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#000' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#000' },
            grid: { color: '#000' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#000' },
            grid: { color: '#000' }
          }
        }
      }
    });
  };

  // Modifica generarReportePDF para usar las quejas filtradas
  const generarReportePDF = async () => {
    const quejasFiltradas = getQuejasFiltradas();
    renderPdfChart(quejasFiltradas);
    await new Promise((r) => setTimeout(r, 300));

    const input = hiddenReporteRef.current;

    const canvas = await html2canvas(input, { 
      scale: 2,
      useCORS: true,
      scrollY: 0,
      windowHeight: input.scrollHeight,
      height: input.scrollHeight,
      backgroundColor: '#e6d194'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
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
    <div style={{ padding: '1rem', background: '#e6d194', color: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '1rem' }}>
        <button onClick={generarReportePDF} style={{ background: '#19d150ff', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: '5px' }}>Descargar PDF</button>
        <button onClick={cerrarSesion} style={{ background: '#dc3545', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '5px' }}>Cerrar sesión</button>
      </div>

      {/* Filtros de fecha */}
      <div style={{ marginBottom: 16, background: '#fff', color: '#222', padding: 12, borderRadius: 8, display: 'inline-block' }}>
        <label style={{ marginRight: 8 }}>Filtrar reporte por: </label>
        <select value={filtroRapido} onChange={e => setFiltroRapido(e.target.value)} style={{ marginRight: 8 }}>
          <option value="mes">Este mes</option>
          <option value="año">Este año</option>
          <option value="personalizado">Personalizado</option>
        </select>
        {filtroRapido === "personalizado" && (
          <>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              style={{ marginRight: 8 }}
            />
          </>
        )}
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#611232' }}>SICT-GTO</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: '2 1 60%' }}>
          <canvas ref={chartRefTipo} style={{ maxWidth: '100%', maxHeight: '250px', marginBottom: '2rem' }} />
          <canvas ref={chartRefEstatus} style={{ maxWidth: '100%', maxHeight: '250px' }} />
        </div>

        <div style={{ flex: '1 1 35%', background: '#1e5b4f', padding: '1rem', borderRadius: '10px' }}>
          <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#e6d194' }}>Lista de Quejas</h4>
          <table style={{ width: '100%', fontSize: '12px', background: '#1f103f', color: '#eee', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#a67c00' }}>
                <th>Folio</th>
                <th>Tipo</th>
                <th>Estatus</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {quejas.map((q, idx) => (
                <tr key={q.folio} style={{ backgroundColor: idx % 2 === 0 ? '#1e5b4f' : '#e6d194', color: idx % 2 === 0 ? '#fff' : '#000' }}>
                  <td>{q.folio}</td>
                  <td>{q.tipo}</td>
                  <td>{q.estatus}</td>
                  <td><button onClick={() => seleccionarQueja(q)} style={{ background: '#d12121ff', color: 'white', border: 'none', padding: '3px 6px', borderRadius: '3px' }}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {quejaSeleccionada && (
        <div style={{ marginTop: '2rem', background: '#1e5b4f', padding: '1rem', borderRadius: '10px' }}>
          <h3>Editar Queja: {quejaSeleccionada.folio}</h3>
          <p><strong>Tipo:</strong> {quejaSeleccionada.tipo}</p>
          <p><strong>Texto:</strong> {quejaSeleccionada.texto}</p>
          <label>Nuevo Estatus:</label>
          <select
            value={nuevoEstatus}
            onChange={(e) => setNuevoEstatus(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', borderRadius: '5px' }}
          >
            <option value="Recibida">Recibida</option>
            <option value="En proceso">En proceso</option>
            <option value="Resuelta">Resuelta</option>
          </select>
          <br /><br />
          <button onClick={actualizarEstatus} style={{ marginRight: '10px' }}>Guardar</button>
          <button onClick={() => setQuejaSeleccionada(null)}>Cancelar</button>
        </div>
      )}

      {/* PDF oculto */}
      <div
        ref={hiddenReporteRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          backgroundColor: '#e6d194',
          padding: '20px 20px 10px 20px',
          color: '#000000ff',
          fontFamily: 'Arial',
          fontSize: '12px',
          width: '1000px',
          overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/SICT_horizontal.png" 
            alt="SICT Logo" 
            style={{ maxWidth: '400px', height: 'auto', margin: '0 auto' }} />
        </div>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Reporte de Quejas</h3>
        <div style={{ marginBottom: '30px' }}>
          <canvas ref={pdfChartRef} width={900} height={400} />
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '16px',
            border: '1px solid #ccc'
          }}
        >
          <thead>
            <tr>
              {['Folio', 'Tipo', 'Estatus', 'Fecha'].map((header, idx) => (
                <th
                  key={idx}
                  style={{
                    backgroundColor: '#a67c00',
                    color: 'white',
                    padding: '8px',
                    border: '1px solid #ccc',
                    textAlign: 'left'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getQuejasFiltradas().map((q, rowIdx) => (
              <tr key={q.folio} style={{ backgroundColor: rowIdx % 2 === 0 ? '#1e5b4f' : '#e6d194' }}>
                {[q.folio, q.tipo, q.estatus, new Date(q.fecha).toLocaleString()].map((cell, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: '6px',
                      color: rowIdx % 2 === 0 ? 'white' : '#000',
                      border: '1px solid #ccc'
                    }}
                  >
                    {cell}
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