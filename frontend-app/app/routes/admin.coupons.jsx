import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: '',
    discountType: 'Percentage',
    discountValue: 0,
    expiryDate: '',
    usageLimit: null,
    isActive: true
  });
  const [editing, setEditing] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCoupons();
  }, [navigate]);

  const loadCoupons = async () => {
    try {
      const response = await fetch('http://localhost:5222/api/coupons?page=1&pageSize=100');
      const data = await response.json();
      // Handle paginated response
      setCoupons(data.items || data);
    } catch (err) {
      console.error('Failed to load coupons', err);
      setCoupons([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const couponData = {
        ...form,
        code: form.code.toUpperCase(),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        usageLimit: form.usageLimit || null
      };

      if (editing) {
        await fetch(`http://localhost:5222/api/coupons/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...couponData, id: editing })
        });
        setEditing(null);
      } else {
        await fetch('http://localhost:5222/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(couponData)
        });
      }
      
      setForm({
        code: '',
        discountType: 'Percentage',
        discountValue: 0,
        expiryDate: '',
        usageLimit: null,
        isActive: true
      });
      loadCoupons();
    } catch (err) {
      alert('Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive
    });
    setEditing(coupon.id);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this coupon?')) {
      try {
        await fetch(`http://localhost:5222/api/coupons/${id}`, { method: 'DELETE' });
        loadCoupons();
      } catch (err) {
        alert('Failed to delete coupon');
      }
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      code: '',
      discountType: 'Percentage',
      discountValue: 0,
      expiryDate: '',
      usageLimit: null,
      isActive: true
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Responsive Navbar */}
      <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">🎟️</span>
              <span className="text-lg md:text-xl font-bold">Coupon Management</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/admin/dashboard" className="text-white hover:text-orange-100 transition">
                Dashboard
              </Link>
              <Link to="/admin/products" className="text-white hover:text-orange-100 transition">
                Products
              </Link>
              <Link to="/admin/orders" className="text-white hover:text-orange-100 transition">
                Orders
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
              className="md:hidden text-white hover:text-orange-200 transition p-2"
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
              <div className="px-2 pt-2 pb-3 space-y-1 bg-orange-700 rounded-b-lg">
                <Link
                  to="/admin/dashboard"
                  className="text-white hover:bg-orange-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏠 Dashboard
                </Link>
                <Link
                  to="/admin/products"
                  className="text-white hover:bg-orange-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📦 Products
                </Link>
                <Link
                  to="/admin/orders"
                  className="text-white hover:bg-orange-600 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📋 Orders
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
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Coupons</h1>

        {/* Coupon Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editing ? '✏️ Edit Coupon' : '➕ Create New Coupon'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition uppercase"
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                  required
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (R)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                  placeholder={form.discountType === 'Percentage' ? '10' : '50.00'}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.discountType === 'Percentage' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter amount in Rands'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={form.usageLimit || ''}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-lg transition shadow-md"
              >
                {editing ? '💾 Update Coupon' : '➕ Create Coupon'}
              </button>
              {editing && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600">
            <h2 className="text-xl font-bold text-white">Coupons ({coupons.length})</h2>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎟️</div>
              <p className="text-gray-500 text-lg">No coupons yet. Create your first coupon above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Discount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Usage</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Expiry</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-orange-600 text-lg">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">
                          {coupon.discountType === 'Percentage' 
                            ? `${coupon.discountValue}%` 
                            : `R${coupon.discountValue.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-800">
                            {coupon.usageCount} used
                          </div>
                          <div className="text-gray-500">
                            {coupon.usageLimit ? `Limit: ${coupon.usageLimit}` : 'Unlimited'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {coupon.expiryDate ? (
                          <div className={`text-sm ${isExpired(coupon.expiryDate) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {new Date(coupon.expiryDate).toLocaleDateString()}
                            {isExpired(coupon.expiryDate) && <div className="text-xs">Expired</div>}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No expiry</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          coupon.isActive && !isExpired(coupon.expiryDate)
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.isActive && !isExpired(coupon.expiryDate) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleEdit(coupon)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg mr-2 transition"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
