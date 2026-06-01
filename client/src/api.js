import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
});

export function downloadUrl(path) {
  return `${api.defaults.baseURL}${path}`;
}

export default api;
