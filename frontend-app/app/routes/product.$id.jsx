import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    loadProduct();
    loadProductImages();
    loadReviews();
    loadAverageRating();
    checkLoginStatus();
  }, [id]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('userToken');
    const userIdFromStorage = localStorage.getItem('userId');
    const userNameFromStorage = localStorage.getItem('userName');
    
    if (token && userIdFromStorage) {
      setIsLoggedIn(true);
      setUserId(parseInt(userIdFromStorage));
      setUserName(userNameFromStorage || '');
      checkWishlistStatus(parseInt(userIdFromStorage));
    }
  };

  const loadProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/products/${id}`);
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product', err);
    }
  };

  const loadProductImages = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/productimages/product/${id}`);
      const data = await response.json();
      setProductImages(data);
      if (data.length > 0) {
        setSelectedImage(data.find(img => img.isPrimary) || data[0]);
      }
    } catch (err) {
      console.error('Failed to load product images', err);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/reviews/product/${id}`);
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  const loadAverageRating = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/reviews/product/${id}/average`);
      const data = await response.json();
      setAverageRating(data);
    } catch (err) {
      console.error('Failed to load average rating', err);
    }
  };

  const checkWishlistStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5222/api/wishlist/user/${userId}`);
      const wishlist = await response.json();
      setIsInWishlist(wishlist.some(item => item.productId === parseInt(id)));
    } catch (err) {
      console.error('Failed to check wishlist status', err);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
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

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      if (isInWishlist) {
        setIsInWishlist(false);
      } else {
        const response = await fetch('http://localhost:5222/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId: parseInt(id) })
        });
        
        if (response.ok) {
          setIsInWishlist(true);
        }
      }
    } catch (err) {
      console.error('Failed to update wishlist', err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5222/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(id),
          userId,
          userName,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });

      if (response.ok) {
        setReviewForm({ rating: 5, comment: '' });
        loadReviews();
        loadAverageRating();
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  const displayImage = selectedImage || (productImages.length > 0 ? productImages[0] : null);

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
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="text-white hover:text-blue-100 transition">
                <span className="text-2xl">🛒</span>
              </Link>
              {isLoggedIn ? (
                <Link to="/dashboard" className="text-white hover:text-blue-100 transition">Dashboard</Link>
              ) : (
                <Link to="/login" className="text-white hover:text-blue-100 transition">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700">Home</Link>
          <span className="mx-2 text-gray-500">›</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="mb-4">
              {displayImage ? (
                <img 
                  src={displayImage.imageUrl} 
                  alt={product.name} 
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                />
              ) : product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center text-8xl shadow-lg">
                  📦
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`relative rounded-lg overflow-hidden border-2 transition ${
                      selectedImage?.id === img.id ? 'border-blue-600' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <img 
                      src={img.imageUrl} 
                      alt={`${product.name} ${img.displayOrder}`}
                      className="w-full h-20 object-cover"
                    />
                    {img.isPrimary && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-bl">
                        Primary
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex">{renderStars(Math.round(averageRating.average))}</div>
              <span className="ml-2 text-gray-600">({averageRating.count} reviews)</span>
            </div>

            <p className="text-gray-600 text-lg mb-6">{product.description}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-blue-600">R{product.price.toFixed(2)}</span>
              {product.shippingCost > 0 && (
                <p className="text-gray-600 mt-2">+ R{product.shippingCost.toFixed(2)} shipping</p>
              )}
            </div>

            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-white transition ${
                  product.stock > 0 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
              </button>
              
              <button
                onClick={handleWishlistToggle}
                className={`px-6 py-3 rounded-lg font-bold transition ${
                  isInWishlist 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {isInWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Customer Reviews</h2>

          {/* Add Review Form */}
          {isLoggedIn && (
            <form onSubmit={handleReviewSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Write a Review</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Submit Review
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="ml-3 font-semibold text-gray-800">{review.userName}</span>
                    <span className="ml-3 text-gray-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
