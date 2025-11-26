import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    
    if (!token || !userId) {
      navigate('/login');
      return;
    }
    
    setUserName(name || 'User');
    setUserEmail(email || '');
    loadOrders(userId);
  }, [navigate]);

  const loadOrders = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5222/api/users/${userId}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
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

  const canCancelOrder = (status) => {
    return status === 'Pending' || status === 'Processing';
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await fetch(`http://localhost:5222/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('Cancelled')
      });
      
      const userId = localStorage.getItem('userId');
      loadOrders(userId);
    } catch (err) {
      alert('Failed to cancel order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 text-white hover:text-blue-100 transition">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold">E-Commerce Store</span>
            </Link>
            <div className="flex items-center space-x-6">
              <span className="text-white">Hello, <span className="font-semibold">{userName}</span></span>
              <Link to="/" className="text-white hover:text-blue-100 transition">Shop</Link>
              <Link to="/wishlist" className="text-white hover:text-blue-100 transition">❤️ Wishlist</Link>
              <Link to="/profile" className="text-white hover:text-blue-100 transition">Profile</Link>
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
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl text-white">
              👤
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{userName}</h1>
              <p className="text-gray-600">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Orders ({orders.length})</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
              <Link 
                to="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition">
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-ZA', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.orderItems?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-800">{item.productName}</span>
                            <span className="text-gray-600">Qty: {item.quantity} × R{item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                      <div>
                        <span className="text-gray-600">Total: </span>
                        <span className="text-2xl font-bold text-blue-600">R{order.totalAmount.toFixed(2)}</span>
                      </div>
                      {canCancelOrder(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
