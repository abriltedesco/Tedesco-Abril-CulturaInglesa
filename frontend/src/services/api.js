// Soporta tanto el proxy de desarrollo de Vite (/api) como conexión directa
const resolveApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // En navegador con Vite dev server (puerto 5174 / 5173), usar el proxy local relativo
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    return '/api';
  }
  return 'http://localhost:3000/api';
};

export const request = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('authToken');
  const baseUrl = resolveApiUrl();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    let response;
    try {
      response = await fetch(`${baseUrl}${endpoint}`, config);
    } catch (primaryErr) {
      // Fallback a conexión directa si el proxy no responde
      if (baseUrl !== 'http://localhost:3000/api') {
        response = await fetch(`http://localhost:3000/api${endpoint}`, config);
      } else {
        throw primaryErr;
      }
    }

    const result = await response.json();

    if (!response.ok || result.success === false) {
      const errorMsg = result.message || `Error ${response.status}: Ha ocurrido un error inesperado.`;
      throw new Error(errorMsg);
    }

    return result.data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor backend. Verificá que el backend esté ejecutándose en http://localhost:3000 (npm start en la carpeta backend)');
    }
    throw error;
  }
};
