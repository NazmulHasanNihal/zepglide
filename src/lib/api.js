export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const fetchApi = async (endpoint, options = {}) => {
  return fetch(`${API_BASE_URL}${endpoint}`, options);
};
