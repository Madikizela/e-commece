import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function AdminReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30'); // days
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    newCustomers: 0,
    topProducts: [],
    revenueByStatus: {},
    ordersOverTime: []
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate, dateRange]);

  const loadData = async () => {
    try {
      // Load all data
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch('http://localhost:5222/api/orders'),
        fetch('http://localhost:5222/api/products'),
        fetch('http://localhost:5222/api/users')
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const customersData = await customersRes.json();

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);

      // Calculate analytics
      calculateAnalytics(ordersData, productsData, customersData);
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const calculateAnalytics = (ordersData, productsData, customersData) => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

    // Filter orders by date range
    const filteredOrders = ordersData.filter(order => 
      new Date(order.createdAt) >= daysAgo
    );

    // Total revenue
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Average order value
    const averageOrderValue = filteredOrders.length > 0 
      ? totalRevenue / filteredOrders.length 
      : 0;

    // New customers in date range
    const newCustomers = customersData.filter(customer => 
      new Date(customer.createdAt) >= daysAgo
    ).length;

    // Revenue by status
    const revenueByStatus = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + order.totalAmount;
      return acc;
    }, {});

    // Top products by revenue
    const productRevenue = {};
    filteredOrders.forEach(order => {
      order.orderItems?.forEach(item => {
        productRevenue[item.productName] = (productRevenue[item.productName] || 0) + 
          (item.price * item.quantity);
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    // Orders over time (grouped by day)
    const ordersOverTime = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      ordersOverTime[date] = (ordersOverTime[date] || 0) + 1;
    });

    setAnalytics({
      totalRevenue,
      totalOrders: filteredOrders.length,
      averageOrderValue,
      totalCustomers: customersData.length,
      newCustomers,
      topProducts,
      revenueByStatus,
      ordersOverTime
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">📊</span>
              <span className="text-xl font-bold">Admin - Analytics & Reports</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/dashboard" className="text-white hover:text-green-100 transition">
                Dashboard
              </Link>
              <Link to="/admin/products" className="text-white hover:text-green-100 transition">
                Products
              </Link>
              <Link to="/admin/orders" className="text-white hover:text-green-100 transition">
                Orders
              </Link>
              <Link to="/admin/customers" className="text-white hover:text-green-100 transition">
                Customers
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  navigate('/admin/login');
                }}
                className="text-white hover:text-green-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Date Range Selector */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">💰</div>
              <div className="text-xs text-gray-500 uppercase">Revenue</div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              R{analytics.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Total revenue in period
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📦</div>
              <div className="text-xs text-gray-500 uppercase">Orders</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.totalOrders}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Total orders placed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">💵</div>
              <div className="text-xs text-gray-500 uppercase">Avg Order</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              R{analytics.averageOrderValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Average order value
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">👥</div>
              <div className="text-xs text-gray-500 uppercase">Customers</div>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.newCustomers}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              New customers
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Products by Revenue</h2>
            {analytics.topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sales data available</p>
            ) : (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{product.name}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(product.revenue / analytics.topProducts[0].revenue) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="font-bold text-green-600">R{product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Revenue by Order Status</h2>
            {Object.keys(analytics.revenueByStatus).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders data available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.revenueByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, revenue]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <div className="flex-1 ml-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(revenue / analytics.totalRevenue) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-bold text-blue-600">R{revenue.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {((revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Orders Over Time</h2>
          {Object.keys(analytics.ordersOverTime).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders data available</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end space-x-2 min-w-max h-64">
                {Object.entries(analytics.ordersOverTime)
                  .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                  .map(([date, count]) => {
                    const maxCount = Math.max(...Object.values(analytics.ordersOverTime));
                    const height = (count / maxCount) * 100;
                    return (
                      <div key={date} className="flex flex-col items-center">
                        <div className="text-xs font-semibold text-gray-700 mb-1">{count}</div>
                        <div
                          className="w-12 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500"
                          style={{ height: `${height}%`, minHeight: '20px' }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {date}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Insights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-bold text-gray-800">{analytics.totalCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Customers</span>
                <span className="font-bold text-green-600">{analytics.newCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Orders/Customer</span>
                <span className="font-bold text-gray-800">
                  {analytics.totalCustomers > 0 
                    ? (analytics.totalOrders / analytics.totalCustomers).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Product Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span className="font-bold text-gray-800">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Stock</span>
                <span className="font-bold text-green-600">
                  {products.filter(p => p.stock > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Out of Stock</span>
                <span className="font-bold text-red-600">
                  {products.filter(p => p.stock === 0).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Order Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-bold text-gray-800">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period Orders</span>
                <span className="font-bold text-blue-600">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-bold text-gray-800">
                  {analytics.totalCustomers > 0
                    ? ((analytics.totalOrders / analytics.totalCustomers) * 100).toFixed(1)
                    : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
