import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const userIdFromStorage = localStorage.getItem('userId');
    
    if (token && userIdFromStorage) {
      setIsLoggedIn(true);
      setUserId(parseInt(userIdFromStorage));
      loadWishlist(parseInt(userIdFromStorage));
    } else {
      navigate('/login');
    }
  };

  const loadWishlist = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5222/api/wishlist/user/${userId}`);
      const data = await response.json();
      
      // Load full product details for each wishlist item
      const wishlistWithProducts = await Promise.all(
        data.map(async (item) => {
          const productRes = await fetch(`http://localhost:5222/api/products/${item.productId}`);
          const product = await productRes.json();
          return { ...item, product };
        })
      );
      
      setWishlist(wishlistWithProducts);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId) => {
    try {
      await fetch(`http://localhost:5222/api/wishlist/${wishlistId}`, {
        method: 'DELETE'
      });
      loadWishlist(userId);
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  const handleMoveToCart = (wishlistItem) => {
    handleAddToCart(wishlistItem.product);
    handleRemoveFromWishlist(wishlistItem.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-pink-600 to-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 text-white hover:text-pink-100 transition">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold">E-Commerce Store</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-pink-100 transition">Home</Link>
              <Link to="/cart" className="text-white hover:text-pink-100 transition">
                <span className="text-2xl">🛒</span>
              </Link>
              <Link to="/dashboard" className="text-white hover:text-pink-100 transition">Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Wishlist</h1>
          <p className="text-gray-600">Save your favorite items for later</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-8xl mb-6">💔</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Start adding products you love!</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-800">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in your wishlist
                </div>
                <Link
                  to="/"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                  <Link to={`/product/${item.product.id}`}>
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                  </Link>

                  <div className="p-6">
                    <Link to={`/product/${item.product.id}`}>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 transition">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.product.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-blue-600">
                        R{item.product.price.toFixed(2)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.product.stock > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        disabled={item.product.stock === 0}
                        className={`flex-1 py-2 rounded-lg font-semibold transition ${
                          item.product.stock > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        🛒 Move to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-semibold rounded-lg transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
