import axios from 'axios';
import config from '../config';

const api = axios.create({
	baseURL: config.apiUrl,
});

// Request interceptor to add token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Clear local storage
			localStorage.removeItem('token');
			localStorage.removeItem('user');

			// Redirect to login
			window.location.href = '/login?expired=true';
		}
		return Promise.reject(error);
	}
);

export default api;
