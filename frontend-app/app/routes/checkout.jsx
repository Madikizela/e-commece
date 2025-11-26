import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', address: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    checkLoginStatus();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cartData.length === 0) {
      navigate('/cart');
    }
    setCart(cartData);
  };

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userId) {
      setIsLoggedIn(true);
      loadUserInfo(userId);
      setUserInfo({ name: userName || '', email: userEmail || '', address: '' });
    } else {
      setShowLoginPrompt(true);
    }
  };

  const loadUserInfo = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5222/api/users/${userId}`);
      const data = await response.json();
      setUserInfo({ name: data.name, email: data.email, address: data.address });
    } catch (err) {
      console.error('Failed to load user info', err);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getShipping = () => {
    return cart.reduce((sum, item) => sum + ((item.shippingCost || 0) * item.quantity), 0);
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getSubtotal();
    if (appliedCoupon.discountType === 'Percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      return appliedCoupon.discountValue;
    }
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() - getDiscount();
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5222/api/coupons/validate/${couponCode}`);
      if (response.ok) {
        const coupon = await response.json();
        setAppliedCoupon(coupon);
        setCouponError('');
        alert(`Coupon applied! You saved R${getDiscount().toFixed(2)}`);
      } else {
        const error = await response.text();
        setCouponError(error);
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const order = {
      customerName: userInfo.name,
      customerEmail: userInfo.email,
      shippingAddress: userInfo.address,
      totalAmount: getTotal(),
      status: 'Pending',
      orderItems: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const response = await fetch('http://localhost:5222/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        localStorage.removeItem('cart');
        alert('Order placed successfully!');
        navigate('/dashboard');
      } else {
        alert('Failed to place order');
      }
    } catch (err) {
      alert('Failed to place order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 text-white hover:text-blue-100 transition">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold">E-Commerce Store</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>

        {isLoggedIn ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                    <textarea
                      value={userInfo.address}
                      onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
                      placeholder="Enter your shipping address"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-800">R{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                
                {/* Coupon Code Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Have a coupon code?</h3>
                  {!appliedCoupon ? (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-600 text-sm mt-2">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <div className="font-semibold text-green-800">{appliedCoupon.code}</div>
                        <div className="text-sm text-green-600">
                          {appliedCoupon.discountType === 'Percentage' 
                            ? `${appliedCoupon.discountValue}% off` 
                            : `R${appliedCoupon.discountValue} off`}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{getShipping() > 0 ? `R${getShipping().toFixed(2)}` : 'Free'}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-R{getDiscount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-blue-600">R{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
                >
                  Place Order
                </button>

                <Link
                  to="/cart"
                  className="block text-center text-blue-600 hover:text-blue-700 font-semibold mt-4 transition"
                >
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
              <p className="text-gray-600">Please login or create an account to complete your purchase</p>
            </div>

            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition duration-200 text-center"
              >
                Login to Existing Account
              </Link>

              <Link
                to="/register"
                className="block w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 text-center"
              >
                Create New Account
              </Link>

              <Link
                to="/cart"
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition duration-200 text-center"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
