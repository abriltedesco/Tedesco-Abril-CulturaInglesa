const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const request = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('authToken');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      const errorMsg = result.message || `Error ${response.status}: Ha ocurrido un error inesperado.`;
      throw new Error(errorMsg);
    }

    return result.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor backend. Verificá que el backend esté ejecutándose en http://localhost:3000');
    }
    throw error;
  }
};
