// API configuration and utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        result.error || result.message || `HTTP ${response.status}`
      );
    }

    if (!result.success) {
      throw new ApiError(
        response.status,
        result.error || result.message || 'Request failed'
      );
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    console.error('API Request failed:', error);
    throw new ApiError(0, 'Network error or server unavailable');
  }
}

// Worker API functions
export const workerApi = {
  // Get all workers
  getAll: (): Promise<any[]> => 
    apiRequest('/workers'),

  // Get single worker
  getById: (id: string): Promise<any> => 
    apiRequest(`/workers/${id}`),

  // Create new worker
  create: (data: { name: string; phone: string; powerLoomNumber?: number; role?: string }): Promise<any> =>
    apiRequest('/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update worker
  update: (id: string, data: { name: string; phone: string; powerLoomNumber?: number; role?: string }): Promise<any> =>
    apiRequest(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete worker
  delete: (id: string): Promise<void> =>
    apiRequest(`/workers/${id}`, {
      method: 'DELETE',
    }),
};

// Product API functions
export const productApi = {
  // Get all products
  getAll: (): Promise<any[]> =>
    apiRequest('/products'),

  // Get single product
  getById: (id: string): Promise<any> =>
    apiRequest(`/products/${id}`),

  // Create new product
  create: (data: { name: string; workerSalary: number; ownerSalary: number | null }): Promise<any> =>
    apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update product
  update: (id: string, data: { name?: string; workerSalary?: number; ownerSalary?: number | null }): Promise<any> =>
    apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete product
  delete: (id: string): Promise<void> =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// Powerloom Production API
export const powerloomProductionApi = {
  // List by loom number (1/2/3)
  getAll: (loomNumber?: number): Promise<any[]> =>
    apiRequest(`/powerloom-production${loomNumber ? `?loom=${loomNumber}` : ''}`),

  // Create new production entry
  create: (data: {
    loomNumber: 1 | 2 | 3;
    date: string;
    worker: string; // worker _id
    machines: Array<{ index: number; product: string; quantity: number }>;
  }): Promise<any> =>
    apiRequest('/powerloom-production', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export API configuration
export { API_BASE_URL, ApiError };
export type { ApiResponse };