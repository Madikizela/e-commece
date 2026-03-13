import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import CustomerNav from '../components/CustomerNav';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    checkLoginStatus();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
  };

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const name = localStorage.getItem('userName');
    setIsLoggedIn(!!token);
    setUserName(name || '');
  };

  const updateQuantity = (productId, change) => {
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)) };
      }
      return item;
    });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getShipping = () => {
    return cart.reduce((sum, item) => sum + ((item.shippingCost || 0) * item.quantity), 0);
  };

  const getTotal = () => {
    return getSubtotal() + getShipping();
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav userName={userName} cartCount={getCartCount()} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
            <div className="text-4xl md:text-6xl mb-4">🛒</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to get started!</p>
            <Link 
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 md:px-8 py-3 rounded-lg transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md p-4 md:p-6">
                  {/* Mobile Layout */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-20 md:w-24 h-20 md:h-24 flex-shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-2xl md:text-4xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{item.description}</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600">R{item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls & Remove Button */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-white hover:bg-gray-200 rounded-md font-bold transition active:scale-95"
                        >
                          -
                        </button>
                        <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 bg-white hover:bg-gray-200 rounded-md font-bold transition disabled:opacity-50 active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 font-semibold transition p-2 hover:bg-red-50 rounded-lg active:scale-95"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning */}
                  {item.quantity >= item.stock && (
                    <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded-lg">
                      <p className="text-orange-700 text-sm">
                        ⚠️ Maximum quantity reached ({item.stock} available)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 sticky top-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>R{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{getShipping() > 0 ? `R${getShipping().toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-lg md:text-xl font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-blue-600">R{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 md:py-4 rounded-lg transition duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/"
                  className="block text-center text-blue-600 hover:text-blue-700 font-semibold mt-4 transition"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    <span>🔒 Secure Checkout</span>
                    <span>📦 Free Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
