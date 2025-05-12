const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080/api';

// export interface ApiError extends Error {
//   data?: any;
// }

export interface ApiError extends Error {
  data?: { error?: string };
  status?: number;
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'data' in err;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = new Error(response.statusText);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json().catch(() => ({})) as T;
};

const apiService = {
  get: async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, body: unknown, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    return handleResponse<T>(response);
  },
};

export default apiService;
