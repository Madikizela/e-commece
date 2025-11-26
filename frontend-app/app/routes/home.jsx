import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { Link } from 'react-router';
import CustomerNav from '../components/CustomerNav';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    checkLoginStatus();
    updateCartCount();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, priceFilter, stockFilter, categoryFilter, sortBy]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const name = localStorage.getItem('userName');
    setIsLoggedIn(!!token);
    setUserName(name || '');
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setToast({ message: 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const response = await fetch('http://localhost:5222/api/categories');
    const data = await response.json();
    setCategories(data);
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.categoryId === parseInt(categoryFilter));
    }

    // Price filter
    if (priceFilter === 'low') {
      filtered = filtered.filter(p => p.price < 50);
    } else if (priceFilter === 'medium') {
      filtered = filtered.filter(p => p.price >= 50 && p.price <= 200);
    } else if (priceFilter === 'high') {
      filtered = filtered.filter(p => p.price > 200);
    }

    // Stock filter
    if (stockFilter === 'instock') {
      filtered = filtered.filter(p => p.stock > 0);
    } else if (stockFilter === 'outofstock') {
      filtered = filtered.filter(p => p.stock === 0);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    setToast({ message: `${product.name} added to cart!`, type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Professional Navigation */}
      <CustomerNav userName={userName} cartCount={cartCount} />

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-5xl font-bold mb-4 animate-fade-in">Welcome to ShopHub</h1>
              <p className="text-xl text-blue-100">Discover quality products at amazing prices</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <select 
                value={priceFilter} 
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="all">All Prices</option>
                <option value="low">Under R50</option>
                <option value="medium">R50 - R200</option>
                <option value="high">Over R200</option>
              </select>
            </div>

            <div>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="all">All Items</option>
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>

            <div>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              >
                <option value="">Sort By</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {(searchTerm || priceFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all' || sortBy) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriceFilter('all');
                setStockFilter('all');
                setCategoryFilter('all');
                setSortBy('');
              }}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600 font-medium">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No products found</h2>
            <p className="text-gray-500">
              {products.length === 0 
                ? 'No products available yet. Check back soon!' 
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-56 object-cover" 
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-6xl">
                      📦
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      OUT OF STOCK
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 5 && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      LOW STOCK
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                    {product.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-3xl font-bold text-blue-600">
                      R{product.price.toFixed(2)}
                    </p>
                    <p className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} available` : 'Unavailable'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                      className={`flex-1 py-3 rounded-lg font-bold text-white transition-all duration-200 ${
                        product.stock > 0 
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                    </button>
                    
                    <Link
                      to={`/product/${product.id}`}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      👁️
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
}
