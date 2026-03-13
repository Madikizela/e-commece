const API_URL = 'http://localhost:5222/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Handle 401 Unauthorized - redirect to appropriate login
    if (response.status === 401) {
      // Check if we're in an admin context
      const isAdminContext = window.location.pathname.includes('/admin');
      if (isAdminContext) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('userToken');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to get admin auth headers
const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const productService = {
  getAll: async (page = 1, pageSize = 100, search = '', categoryId = null, sortBy = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
      ...(categoryId && { categoryId: categoryId.toString() }),
      ...(sortBy && { sortBy })
    });
    
    const response = await fetch(`${API_URL}/products?${params}`);
    const data = await handleResponse(response);
    
    // Return the items array for backward compatibility, but also include pagination info
    return {
      products: data.items || [],
      pagination: {
        totalCount: data.totalCount || 0,
        page: data.page || 1,
        pageSize: data.pageSize || pageSize,
        totalPages: data.totalPages || 1,
        hasNextPage: data.hasNextPage || false,
        hasPreviousPage: data.hasPreviousPage || false
      }
    };
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_URL}/products/${id}`);
    return handleResponse(response);
  },
  
  create: async (product) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(product)
    });
    return handleResponse(response);
  },
  
  update: async (id, product) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(product)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_URL}/products/${id}`, { 
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
  }
};

export const orderService = {
  getAll: async (page = 1, pageSize = 10, status = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(status && { status })
    });
    
    const response = await fetch(`${API_URL}/orders?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    
    return {
      orders: data.items || [],
      pagination: {
        totalCount: data.totalCount || 0,
        page: data.page || 1,
        pageSize: data.pageSize || pageSize,
        totalPages: data.totalPages || 1,
        hasNextPage: data.hasNextPage || false,
        hasPreviousPage: data.hasPreviousPage || false
      }
    };
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  create: async (order) => {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(order)
    });
    return handleResponse(response);
  },
  
  updateStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Order status update failed:', error);
      throw error;
    }
  }
};

export const authService = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },
  
  createAdmin: async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/admin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(response);
  }
};

export const categoryService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/categories`);
    return handleResponse(response);
  }
};
