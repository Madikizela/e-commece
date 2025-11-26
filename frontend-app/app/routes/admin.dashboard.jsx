import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { productService, orderService } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, orders: 0, pendingOrders: 0 });
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUsername');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    setUsername(user || 'Admin');
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const products = await productService.getAll();
      const orders = await orderService.getAll();
      const pending = orders.filter(o => o.status === 'Pending').length;
      
      setStats({
        products: products.length,
        orders: orders.length,
        pendingOrders: pending
      });
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <div className="flex items-center space-x-6">
              <span className="text-white">Welcome, <span className="font-semibold">{username}</span></span>
              <Link to="/" className="text-white hover:text-blue-200 transition">View Store</Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold mb-1">Total Products</p>
                <p className="text-4xl font-bold">{stats.products}</p>
              </div>
              <div className="text-5xl opacity-50">📦</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold mb-1">Total Orders</p>
                <p className="text-4xl font-bold">{stats.orders}</p>
              </div>
              <div className="text-5xl opacity-50">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-semibold mb-1">Pending Orders</p>
                <p className="text-4xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="text-5xl opacity-50">⏳</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            to="/admin/products" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Products</h3>
            <p className="text-gray-600 text-sm">Add, edit, or remove products</p>
          </Link>

          <Link 
            to="/admin/orders" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Orders</h3>
            <p className="text-gray-600 text-sm">View and update order status</p>
          </Link>

          <Link 
            to="/admin/inventory" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Inventory Management</h3>
            <p className="text-gray-600 text-sm">Track stock levels and history</p>
          </Link>

          <Link 
            to="/admin/customers" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Customers</h3>
            <p className="text-gray-600 text-sm">View and manage customer accounts</p>
          </Link>

          <Link 
            to="/admin/reports" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">View Reports</h3>
            <p className="text-gray-600 text-sm">Analytics and business insights</p>
          </Link>

          <Link 
            to="/admin/coupons" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">🎟️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Coupons</h3>
            <p className="text-gray-600 text-sm">Create and manage discount codes</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
