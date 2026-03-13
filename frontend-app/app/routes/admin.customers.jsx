import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCustomers();
  }, [navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5222/api/users?page=1&pageSize=1000', { headers });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      console.log('Raw customers API response:', data);
      
      // Handle paginated response - extract items array
      const customers = data.items || data || [];
      console.log('Processed customers:', customers.length);
      
      setCustomers(customers);
      setFilteredCustomers(customers);
    } catch (err) {
      console.error('Failed to load customers', err);
      setCustomers([]);
      setFilteredCustomers([]);
    }
  };

  const loadCustomerOrders = async (customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5222/api/orders?page=1&pageSize=1000', { headers });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      const allOrders = data.items || data || [];
      
      // Filter orders by customer email
      const orders = allOrders.filter(order => 
        order.customerEmail === selectedCustomer?.email
      );
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Failed to load customer orders', err);
      setCustomerOrders([]);
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    // Load customer's orders
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5222/api/orders?page=1&pageSize=1000', { headers });
      
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      const allOrders = data.items || data || [];
      
      const orders = allOrders.filter(order => 
        order.customerEmail === customer.email
      );
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Failed to load customer orders', err);
      setCustomerOrders([]);
    }
  };

  const handleDeleteCustomer = async (id) => {
    const customer = customers.find(c => c.id === id);
    
    // Prevent deletion of admin users
    if (customer?.role === 'Admin') {
      alert('Admin users cannot be deleted for security reasons.');
      return;
    }

    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch(`http://localhost:5222/api/users/${id}`, {
          method: 'DELETE',
          headers
        });

        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }

        if (response.ok) {
          loadCustomers();
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.message || 'Failed to delete customer');
        }
      } catch (err) {
        console.error('Failed to delete customer', err);
        alert('Failed to delete customer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Responsive Navbar */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">👥</span>
              <span className="text-lg md:text-xl font-bold">Customer Management</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/admin/dashboard" className="text-white hover:text-purple-100 transition">
                Dashboard
              </Link>
              <Link to="/admin/products" className="text-white hover:text-purple-100 transition">
                Products
              </Link>
              <Link to="/admin/orders" className="text-white hover:text-purple-100 transition">
                Orders
              </Link>
              <Link to="/admin/inventory" className="text-white hover:text-purple-100 transition">
                Inventory
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  navigate('/admin/login');
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition active:scale-95"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white hover:text-purple-200 transition p-2"
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
              <div className="px-2 pt-2 pb-3 space-y-1 bg-purple-700 rounded-b-lg">
                <Link
                  to="/admin/dashboard"
                  className="text-white hover:bg-purple-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏠 Dashboard
                </Link>
                <Link
                  to="/admin/products"
                  className="text-white hover:bg-purple-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📦 Products
                </Link>
                <Link
                  to="/admin/orders"
                  className="text-white hover:bg-purple-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📋 Orders
                </Link>
                <Link
                  to="/admin/inventory"
                  className="text-white hover:bg-purple-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📊 Inventory
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    navigate('/admin/login');
                    setShowMobileMenu(false);
                  }}
                  className="text-red-300 hover:bg-red-600 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium transition"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Customer Management</h1>
          <p className="text-gray-600">View and manage customer accounts</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔍</span>
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800">{customers.length}</div>
            <div className="text-gray-600">Total Customers</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">🆕</div>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => {
                const createdDate = new Date(c.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return createdDate > weekAgo;
              }).length}
            </div>
            <div className="text-gray-600">New This Week</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-2xl font-bold text-blue-600">{filteredCustomers.length}</div>
            <div className="text-gray-600">Search Results</div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Customers ({filteredCustomers.length})</h2>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                            customer.role === 'Admin' 
                              ? 'bg-gradient-to-br from-red-500 to-red-700' 
                              : 'bg-gradient-to-br from-purple-400 to-blue-500'
                          }`}>
                            {customer.role === 'Admin' ? '👑' : customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                              {customer.role === 'Admin' && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {customer.address || 'No address'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          👁️ View
                        </button>
                        {customer.role === 'Admin' ? (
                          <span className="text-gray-400 cursor-not-allowed" title="Admin users cannot be deleted">
                            🔒 Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Customer Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl mr-4">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">Customer ID: {selectedCustomer.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{selectedCustomer.address || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Joined</label>
                  <p className="text-gray-900">{new Date(selectedCustomer.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Customer Orders */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Order History ({customerOrders.length})
              </h3>
              
              {customerOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">Order #{order.id}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            R{order.totalAmount.toFixed(2)}
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.orderItems?.length || 0} item(s)
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800">Total Spent:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        R{customerOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
