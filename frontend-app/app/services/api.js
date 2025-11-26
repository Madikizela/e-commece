const API_URL = 'http://localhost:5222/api';

export const productService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/products`);
    return response.json();
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_URL}/products/${id}`);
    return response.json();
  },
  
  create: async (product) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return response.json();
  },
  
  update: async (id, product) => {
    await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  },
  
  delete: async (id) => {
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
  }
};

export const orderService = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/orders`);
    return response.json();
  },
  
  create: async (order) => {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.json();
  },
  
  updateStatus: async (id, status) => {
    await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
  }
};
