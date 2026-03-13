import { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { Link } from 'react-router';
import CustomerNav from '../components/CustomerNav';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import QuickView from '../components/QuickView';
import ProductComparison from '../components/ProductComparison';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [productRatings, setProductRatings] = useState({});
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [compareProducts, setCompareProducts] = useState([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 100,
    totalPages: 1
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    checkLoginStatus();
    updateCartCount();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, priceFilter, stockFilter, categoryFilter, sortBy]);

  useEffect(() => {
    if (products.length > 0) {
      loadProductRatings();
    }
  }, [products]);

  const loadProductRatings = async () => {
    try {
      const ratings = {};
      await Promise.all(
        products.map(async (product) => {
          try {
            const response = await fetch(`http://localhost:5222/api/reviews/product/${product.id}/average`);
            const data = await response.json();
            ratings[product.id] = data;
          } catch (err) {
            console.error(`Failed to load rating for product ${product.id}`, err);
            ratings[product.id] = { average: 0, count: 0 };
          }
        })
      );
      setProductRatings(ratings);
    } catch (err) {
      console.error('Error loading product ratings:', err);
    }
  };

  const renderStars = (rating, size = 'text-sm') => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`${size} ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const name = localStorage.getItem('userName');
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
      const response = await productService.getAll(1, 100); // Load first 100 products
      setProducts(response.products || []);
      setFilteredProducts(response.products || []);
      setPagination(response.pagination || {});
    } catch (err) {
      console.error('Error loading products:', err);
      setToast({ message: 'Failed to load products: ' + err.message, type: 'error' });
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  const filterProducts = () => {
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
      filtered.sort((a, b) => a.name?.localeCompare(b.name) || 0);
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

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleAddToWishlist = async (product) => {
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      setToast({ message: 'Please login to add items to wishlist', type: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5222/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId), productId: product.id })
      });
      
      if (response.ok) {
        setToast({ message: `${product.name} added to wishlist!`, type: 'success' });
      } else {
        setToast({ message: 'Failed to add to wishlist', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to add to wishlist', type: 'error' });
    }
  };

  const handleAddToCompare = (product) => {
    if (compareProducts.length >= 4) {
      setToast({ message: 'You can compare up to 4 products only', type: 'error' });
      return;
    }
    
    if (compareProducts.find(p => p.id === product.id)) {
      setToast({ message: 'Product already in comparison', type: 'error' });
      return;
    }
    
    setCompareProducts([...compareProducts, product]);
    setToast({ message: `${product.name} added to comparison`, type: 'success' });
  };

  const handleRemoveFromCompare = (productId) => {
    setCompareProducts(compareProducts.filter(p => p.id !== productId));
  };

  const handleOpenComparison = () => {
    if (compareProducts.length < 2) {
      setToast({ message: 'Add at least 2 products to compare', type: 'error' });
      return;
    }
    setIsComparisonOpen(true);
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

      {/* Comparison Bar */}
      {compareProducts.length > 0 && (
        <div className="bg-blue-600 text-white py-3 px-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-semibold">Compare ({compareProducts.length}/4):</span>
              <div className="flex space-x-2">
                {compareProducts.map((product) => (
                  <div key={product.id} className="bg-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                    <span className="truncate max-w-20">{product.name}</span>
                    <button
                      onClick={() => handleRemoveFromCompare(product.id)}
                      className="ml-2 text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleOpenComparison}
                disabled={compareProducts.length < 2}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  compareProducts.length >= 2
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-500 text-blue-300 cursor-not-allowed'
                }`}
              >
                Compare Now
              </button>
              <button
                onClick={() => setCompareProducts([])}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <>
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">Welcome to ShopHub</h1>
              <p className="text-lg md:text-xl text-blue-100">Discover quality products at amazing prices</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
            {/* Mobile-First Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6 md:mb-8">
              {/* Mobile Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-base"
                />
              </div>

              {/* Mobile Filter Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <select 
                    value={priceFilter} 
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-3 md:px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-sm md:text-base"
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
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 md:px-6 py-2 rounded-lg transition w-full md:w-auto"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4 md:mb-6 text-gray-600 font-medium text-sm md:text-base">
              Showing {Array.isArray(filteredProducts) ? filteredProducts.length : 0} of {Array.isArray(products) ? products.length : 0} products
            </div>

            {/* Mobile-Optimized Products Grid */}
            {!Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
              <div className="text-center py-12 md:py-20 bg-white rounded-xl shadow-md">
                <div className="text-4xl md:text-6xl mb-4">
                  {!Array.isArray(products) || products.length === 0 ? '🏪' : '🔍'}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">
                  {!Array.isArray(products) || products.length === 0 
                    ? 'Store Opening Soon!' 
                    : 'No products match your search'}
                </h2>
                <p className="text-gray-500 text-sm md:text-base mb-6">
                  {!Array.isArray(products) || products.length === 0 
                    ? 'We\'re adding amazing products. Check back soon for great deals!' 
                    : 'Try adjusting your filters or search terms'}
                </p>
                {(searchTerm || priceFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all' || sortBy) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPriceFilter('all');
                      setStockFilter('all');
                      setCategoryFilter('all');
                      setSortBy('');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                  >
                    🔄 Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2"
                  >
                    <div className="relative">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-48 md:h-56 object-cover" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-48 md:h-56 bg-gradient-to-br from-purple-400 to-blue-500 flex flex-col items-center justify-center text-white ${product.imageUrl ? 'hidden' : 'flex'}`}
                      >
                        <div className="text-4xl md:text-6xl mb-2">📷</div>
                        <div className="text-sm md:text-base font-semibold text-center px-4">
                          {product.name}
                        </div>
                      </div>
                      {product.stock === 0 && (
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          OUT OF STOCK
                        </div>
                      )}
                      {product.stock > 0 && product.stock < 5 && (
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-orange-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          LOW STOCK
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-5">
                      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                      
                      {/* Rating Display */}
                      {productRatings[product.id] && (
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {renderStars(productRatings[product.id].average)}
                          </div>
                          <span className="ml-2 text-xs text-gray-600">
                            ({productRatings[product.id].count})
                          </span>
                        </div>
                      )}
                      
                      <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-2 h-8 md:h-10">
                        {product.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-3 md:mb-4">
                        <p className="text-2xl md:text-3xl font-bold text-blue-600">
                          R{product.price?.toFixed(2) || '0.00'}
                        </p>
                        <p className={`text-xs md:text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} available` : 'Unavailable'}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <button 
                          disabled={product.stock === 0}
                          onClick={() => handleAddToCart(product)}
                          className={`flex-1 py-2 md:py-3 rounded-lg font-bold text-white transition-all duration-200 text-xs md:text-sm ${
                            product.stock > 0 
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95 hover:shadow-blue-300' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {product.stock > 0 ? '🛒 Cart' : '❌ Out'}
                        </button>
                        
                        <button
                          onClick={() => handleQuickView(product)}
                          className="px-2 md:px-3 py-2 md:py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all duration-200 flex items-center justify-center active:scale-95"
                          title="Quick View"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="px-2 md:px-3 py-2 md:py-3 bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold rounded-lg transition-all duration-200 flex items-center justify-center active:scale-95"
                          title="Add to Wishlist"
                        >
                          🤍
                        </button>

                        <button
                          onClick={() => handleAddToCompare(product)}
                          className={`px-2 md:px-3 py-2 md:py-3 font-bold rounded-lg transition-all duration-200 flex items-center justify-center active:scale-95 ${
                            compareProducts.find(p => p.id === product.id)
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600'
                          }`}
                          title="Compare"
                        >
                          ⚖️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick View Modal */}
      <QuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
      />

      {/* Product Comparison Modal */}
      <ProductComparison
        products={compareProducts}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onRemoveProduct={handleRemoveFromCompare}
      />
    </div>
  );
}
