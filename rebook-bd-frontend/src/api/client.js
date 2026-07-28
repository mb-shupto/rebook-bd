import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rebook_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
