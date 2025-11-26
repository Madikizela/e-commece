import { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { Link, useNavigate } from 'react-router';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    const data = await orderService.getAll();
    setOrders(data);
  };

  const handleStatusChange = async (id, status) => {
    await orderService.updateStatus(id, status);
    loadOrders();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'Shipped': 'bg-purple-100 text-purple-800 border-purple-300',
      'Delivered': 'bg-green-100 text-green-800 border-green-300',
      'Cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <div className="flex items-center space-x-6">
              <Link to="/admin/dashboard" className="text-white hover:text-blue-200 transition">Dashboard</Link>
              <Link to="/admin/products" className="text-white hover:text-blue-200 transition">Products</Link>
              <Link to="/admin/orders" className="text-white font-semibold border-b-2 border-white">Orders</Link>
              <Link to="/" className="text-white hover:text-blue-200 transition">View Store</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Orders Yet</h2>
            <p className="text-gray-500">Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Order #{order.id}</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">Customer Information</h4>
                      <p className="text-gray-800 font-semibold">{order.customerName}</p>
                      <p className="text-gray-600">{order.customerEmail}</p>
                      <p className="text-gray-600 mt-2">{order.shippingAddress}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">Order Details</h4>
                      <p className="text-gray-800">
                        <span className="font-semibold">Total:</span> 
                        <span className="text-2xl font-bold text-blue-600 ml-2">R{order.totalAmount.toFixed(2)}</span>
                      </p>
                      <p className="text-gray-600 mt-2">
                        <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-ZA', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3">Order Items</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-sm font-semibold text-gray-700">Product</th>
                            <th className="text-center py-2 text-sm font-semibold text-gray-700">Quantity</th>
                            <th className="text-right py-2 text-sm font-semibold text-gray-700">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.orderItems?.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-3 text-gray-800">{item.productName}</td>
                              <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-3 text-right font-semibold text-gray-800">R{item.price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-700">Update Status:</label>
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition font-semibold"
                    >
                      <option value="Pending">⏳ Pending</option>
                      <option value="Processing">🔄 Processing</option>
                      <option value="Shipped">🚚 Shipped</option>
                      <option value="Delivered">✅ Delivered</option>
                      <option value="Cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
