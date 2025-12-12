import axios from 'axios';

// In production (served by Nginx), the proxy handles the /api prefix
// In dev (Vite), the proxy in vite.config.js handles it
const client = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default client;
