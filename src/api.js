import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-quejas.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Aquí puedes agregar headers de autenticación si es necesario
    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

export default api;