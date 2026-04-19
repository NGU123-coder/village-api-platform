import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://village-api-platform.onrender.com/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY
  }
});

export const searchVillages = async (query: string) => {
  if (query.length < 2) return [];
  try {
    const response = await api.get(`/villages`, {
      params: { search: query, limit: 10 }
    });
    return response.data.data;
  } catch (error) {
    console.error('Search API Error:', error);
    return [];
  }
};

export default api;
