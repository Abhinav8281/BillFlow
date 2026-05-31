import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

export function downloadUrl(path) {
  return `${api.defaults.baseURL}${path}`;
}

export default api;
