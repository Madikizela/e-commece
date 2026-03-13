import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { productService, orderService } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, orders: 0, pendingOrders: 0 });
  const [username, setUsername] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUsername');
    
    // Check for proper admin authentication
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Additional check: ensure this is not a regular user token
    const userToken = localStorage.getItem('userToken');
    const userRole = localStorage.getItem('userRole');
    
    // If someone is trying to access admin dashboard with a regular user token, redirect them
    if (userToken && userRole !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    
    setUsername(user || 'Admin');
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const productsResponse = await productService.getAll(1, 100);
      const ordersResponse = await orderService.getAll(1, 100);
      
      const products = productsResponse.products || [];
      const orders = ordersResponse.orders || [];
      const pending = orders.filter(o => o.status === 'Pending').length;
      
      setStats({
        products: products.length,
        orders: orders.length,
        pendingOrders: pending
      });
    } catch (err) {
      console.error('Failed to load stats', err);
      // Set default values if API fails
      setStats({ products: 0, orders: 0, pendingOrders: 0 });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    navigate('/admin/login');
    setShowMobileMenu(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Responsive Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-lg md:text-2xl font-bold text-white">Admin Dashboard</h2>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-white text-sm">Welcome, <span className="font-semibold">{username}</span></span>
              <Link to="/" className="text-white hover:text-blue-200 transition">View Store</Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition active:scale-95"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white hover:text-blue-200 transition p-2"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${showMobileMenu ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${showMobileMenu ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-800 rounded-b-lg">
                <div className="px-3 py-2">
                  <span className="text-white text-sm">Welcome, <span className="font-semibold">{username}</span></span>
                </div>
                <Link
                  to="/"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={closeMobileMenu}
                >
                  🏪 View Store
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-300 hover:bg-red-600 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium transition"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">Dashboard Overview</h1>

        {/* Mobile-Responsive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm font-semibold mb-1">Total Products</p>
                <p className="text-2xl md:text-4xl font-bold">{stats.products}</p>
              </div>
              <div className="text-3xl md:text-5xl opacity-50">📦</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 md:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm font-semibold mb-1">Total Orders</p>
                <p className="text-2xl md:text-4xl font-bold">{stats.orders}</p>
              </div>
              <div className="text-3xl md:text-5xl opacity-50">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 md:p-6 text-white sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs md:text-sm font-semibold mb-1">Pending Orders</p>
                <p className="text-2xl md:text-4xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="text-3xl md:text-5xl opacity-50">⏳</div>
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Quick Actions */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <Link 
            to="/admin/products" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">📦</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">Manage Products</h3>
            <p className="text-gray-600 text-xs md:text-sm">Add, edit, or remove products</p>
          </Link>

          <Link 
            to="/admin/orders" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">📋</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">Manage Orders</h3>
            <p className="text-gray-600 text-xs md:text-sm">View and update order status</p>
          </Link>

          <Link 
            to="/admin/inventory" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">📊</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">Inventory Management</h3>
            <p className="text-gray-600 text-xs md:text-sm">Track stock levels and history</p>
          </Link>

          <Link 
            to="/admin/customers" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">👥</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">Manage Customers</h3>
            <p className="text-gray-600 text-xs md:text-sm">View and manage customer accounts</p>
          </Link>

          <Link 
            to="/admin/reports" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">📈</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">View Reports</h3>
            <p className="text-gray-600 text-xs md:text-sm">Analytics and business insights</p>
          </Link>

          <Link 
            to="/admin/coupons" 
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-4 md:p-6 transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 active:scale-95"
          >
            <div className="text-3xl md:text-4xl mb-2 md:mb-3">🎟️</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2">Manage Coupons</h3>
            <p className="text-gray-600 text-xs md:text-sm">Create and manage discount codes</p>
          </Link>
        </div>

        {/* Mobile-Optimized Recent Activity Section */}
        <div className="mt-8 md:mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            
            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Recent Orders</h3>
                <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {stats.orders > 0 ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">📋</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">New Order Received</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold text-sm">R299.99</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🚚</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Order Shipped</p>
                          <p className="text-xs text-gray-500">1 hour ago</p>
                        </div>
                      </div>
                      <span className="text-blue-600 font-semibold text-sm">R149.50</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-sm">⏳</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Order Pending</p>
                          <p className="text-xs text-gray-500">3 hours ago</p>
                        </div>
                      </div>
                      <span className="text-orange-600 font-semibold text-sm">R89.99</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-gray-500 text-sm">No recent orders</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product & System Activity */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">System Activity</h3>
                <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  Manage →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm">📦</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Products in Catalog</p>
                      <p className="text-xs text-gray-500">Current inventory</p>
                    </div>
                  </div>
                  <span className="text-purple-600 font-semibold text-sm">{stats.products}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✅</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Total Orders Processed</p>
                      <p className="text-xs text-gray-500">All time</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold text-sm">{stats.orders}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm">⏳</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Pending Orders</p>
                      <p className="text-xs text-gray-500">Needs attention</p>
                    </div>
                  </div>
                  <span className="text-orange-600 font-semibold text-sm">{stats.pendingOrders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              <p className="text-lg font-bold text-green-600">R{(stats.orders * 150).toLocaleString()}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-xs text-gray-500 mb-1">Customers</p>
              <p className="text-lg font-bold text-blue-600">{Math.max(stats.orders, 1)}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-xs text-gray-500 mb-1">Growth</p>
              <p className="text-lg font-bold text-purple-600">+12%</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <p className="text-lg font-bold text-yellow-600">4.8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
