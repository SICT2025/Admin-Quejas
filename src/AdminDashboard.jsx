import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Form, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import StatusBadge from './components/StatusBadge';

const AdminDashboard = () => {
  const [quejas, setQuejas] = useState([]);
  const [filteredQuejas, setFilteredQuejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentQueja, setCurrentQueja] = useState(null);
  const [formData, setFormData] = useState({
    estatus: 'Recibida',
    description: ''
  });

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');

  useEffect(() => {
    const fetchQuejas = async () => {
      try {
        const response = await axios.get('https://api-quejas.onrender.com/api/quejas');
        setQuejas(response.data);
        setFilteredQuejas(response.data);
      } catch (err) {
        setError(`Error al cargar quejas: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQuejas();
  }, []);

  useEffect(() => {
    let results = quejas;

    // Aplicar filtros
    if (searchTerm) {
      results = results.filter(q =>
        q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filtroTipo !== 'todos') {
      results = results.filter(q => q.tipo === filtroTipo);
    }

    if (filtroEstatus !== 'todos') {
      results = results.filter(q => q.estatus === filtroEstatus);
    }

    setFilteredQuejas(results);
  }, [searchTerm, quejas, filtroTipo, filtroEstatus]);

  const handleEdit = (queja) => {
    setCurrentQueja(queja);
    setFormData({
      estatus: queja.estatus,
      description: queja.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`https://api-quejas.onrender.com/api/quejas/${currentQueja.id}`, {
        estatus: formData.estatus,
        description: formData.description
      });
      
      // Actualizar la lista
      const updatedQuejas = quejas.map(q => 
        q.id === currentQueja.id ? { ...q, ...formData } : q
      );
      
      setQuejas(updatedQuejas);
      setShowModal(false);
    } catch (err) {
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tiposQuejas = [...new Set(quejas.map(q => q.tipo))];

  if (loading && quejas.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p>Cargando quejas...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Panel de Administración de Quejas</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filtros */}
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <Form.Control
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="col-md-4">
          <Form.Select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="todos">Todos los tipos</option>
            {tiposQuejas.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </Form.Select>
        </div>
        
        <div className="col-md-4">
          <Form.Select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="Recibida">Recibida</option>
            <option value="En proceso">En proceso</option>
            <option value="Resuelta">Resuelta</option>
            <option value="Rechazada">Rechazada</option>
          </Form.Select>
        </div>
      </div>

      {/* Tabla de quejas */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuejas.length > 0 ? (
              filteredQuejas.map(queja => (
                <tr key={queja.id}>
                  <td>{queja.folio}</td>
                  <td>{queja.tipo}</td>
                  <td><StatusBadge status={queja.estatus} /></td>
                  <td>{new Date(queja.fecha).toLocaleString()}</td>
                  <td>{queja.description || 'N/A'}</td>
                  <td>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleEdit(queja)}
                      disabled={loading}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No se encontraron quejas</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal de edición */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Queja {currentQueja?.folio}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={formData.estatus}
                onChange={(e) => setFormData({...formData, estatus: e.target.value})}
              >
                <option value="Recibida">Recibida</option>
                <option value="En proceso">En proceso</option>
                <option value="Resuelta">Resuelta</option>
                <option value="Rechazada">Rechazada</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;