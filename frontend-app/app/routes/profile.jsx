import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '', phone: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, wishlistCount: 0, reviewsCount: 0 });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      navigate('/login');
      return;
    }
    
    loadUserProfile(userId);
    loadUserStats(userId);
  }, [navigate]);

  const loadUserProfile = async (userId) => {
    try {
      const token = localStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5222/api/users/${userId}`, { headers });
      
      if (response.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setUser({ name: data.name, email: data.email, phone: data.phone || '', address: data.address || '' });
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Failed to load profile');
    }
  };

  const loadUserStats = async (userId) => {
    try {
      const token = localStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load orders using the proper endpoint
      const ordersRes = await fetch(`http://localhost:5222/api/users/${userId}/orders?page=1&pageSize=1000`, { headers });
      
      if (ordersRes.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        navigate('/login');
        return;
      }

      const ordersData = await ordersRes.json();
      const orders = ordersData.items || [];
      
      // Load wishlist
      const wishlistRes = await fetch(`http://localhost:5222/api/wishlist/user/${userId}`, { headers });
      const wishlist = await wishlistRes.json().catch(() => []);
      
      // Load reviews using the new user-specific endpoint
      const reviewsRes = await fetch(`http://localhost:5222/api/reviews/user/${userId}`, { headers });
      const reviews = await reviewsRes.json().catch(() => []);
      
      console.log('User stats loaded:', {
        orders: orders.length,
        totalSpent: orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + order.totalAmount, 0),
        wishlist: Array.isArray(wishlist) ? wishlist.length : 0,
        reviews: Array.isArray(reviews) ? reviews.length : 0
      });
      
      setStats({
        totalOrders: orders.length,
        totalSpent: orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + order.totalAmount, 0),
        wishlistCount: Array.isArray(wishlist) ? wishlist.length : 0,
        reviewsCount: Array.isArray(reviews) ? reviews.length : 0
      });
    } catch (err) {
      console.error('Failed to load stats', err);
      setStats({ totalOrders: 0, totalSpent: 0, wishlistCount: 0, reviewsCount: 0 });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5222/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(user)
      });

      if (response.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        navigate('/login');
        return;
      }

      if (response.ok) {
        localStorage.setItem('userName', user.name);
        setMessage('Profile updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5222/api/users/${userId}/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setMessage('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Failed to change password', err);
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
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
              <Link to="/dashboard" className="text-white hover:text-blue-100 transition">Dashboard</Link>
              <Link to="/profile" className="text-white font-semibold border-b-2 border-white">Profile</Link>
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
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h1>

        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
            <p className="font-semibold">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">📦</div>
              <div className="text-xs uppercase opacity-80">Orders</div>
            </div>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <div className="text-sm opacity-90 mt-1">Total Orders</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">💰</div>
              <div className="text-xs uppercase opacity-80">Spent</div>
            </div>
            <div className="text-3xl font-bold">R{stats.totalSpent.toFixed(2)}</div>
            <div className="text-sm opacity-90 mt-1">Total Spent</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">❤️</div>
              <div className="text-xs uppercase opacity-80">Wishlist</div>
            </div>
            <div className="text-3xl font-bold">{stats.wishlistCount}</div>
            <div className="text-sm opacity-90 mt-1">Saved Items</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">⭐</div>
              <div className="text-xs uppercase opacity-80">Reviews</div>
            </div>
            <div className="text-3xl font-bold">{stats.reviewsCount}</div>
            <div className="text-sm opacity-90 mt-1">Reviews Written</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">My Orders</h3>
            <p className="text-gray-600 text-sm">View order history and track shipments</p>
          </Link>

          <Link
            to="/wishlist"
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-pink-500"
          >
            <div className="text-4xl mb-3">❤️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">My Wishlist</h3>
            <p className="text-gray-600 text-sm">View and manage saved items</p>
          </Link>

          <Link
            to="/"
            className="bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500"
          >
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Continue Shopping</h3>
            <p className="text-gray-600 text-sm">Browse products and add to cart</p>
          </Link>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea
                value={user.address}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
                required
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength="6"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength="6"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
