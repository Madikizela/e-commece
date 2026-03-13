import { useState, useEffect } from 'react';

export default function QuickView({ product, isOpen, onClose, onAddToCart, onAddToWishlist }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (isOpen && product) {
      loadProductImages();
      loadReviews();
      loadAverageRating();
    }
  }, [isOpen, product]);

  const loadProductImages = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/productimages/product/${product.id}`);
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
      const response = await fetch(`http://localhost:5222/api/reviews/product/${product.id}`);
      const data = await response.json();
      setReviews(data.slice(0, 3)); // Show only first 3 reviews
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  const loadAverageRating = async () => {
    try {
      const response = await fetch(`http://localhost:5222/api/reviews/product/${product.id}/average`);
      const data = await response.json();
      setAverageRating(data);
    } catch (err) {
      console.error('Failed to load average rating', err);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (!isOpen || !product) return null;

  const displayImage = selectedImage || (productImages.length > 0 ? productImages[0] : null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Quick View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              {/* Main Image */}
              <div className="mb-4">
                {displayImage ? (
                  <img 
                    src={displayImage.imageUrl} 
                    alt={product.name} 
                    className="w-full h-80 object-cover rounded-xl"
                  />
                ) : product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-80 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-80 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex flex-col items-center justify-center text-white">
                    <div className="text-6xl mb-2">📷</div>
                    <div className="text-lg font-semibold text-center px-4">{product.name}</div>
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.slice(0, 4).map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`rounded-lg overflow-hidden border-2 transition ${
                        selectedImage?.id === img.id ? 'border-blue-600' : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <img 
                        src={img.imageUrl} 
                        alt={`${product.name} ${img.displayOrder}`}
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex">{renderStars(averageRating.average)}</div>
                <span className="ml-2 text-gray-600">({averageRating.count} reviews)</span>
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-blue-600">R{product.price.toFixed(2)}</span>
                {product.shippingCost > 0 && (
                  <p className="text-gray-600 mt-1">+ R{product.shippingCost.toFixed(2)} shipping</p>
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
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-white transition ${
                    product.stock > 0 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                </button>
                
                <button
                  onClick={() => onAddToWishlist(product)}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
                >
                  🤍 Wishlist
                </button>
              </div>

              {/* Recent Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Reviews</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-2">
                        <div className="flex items-center mb-1">
                          <div className="flex text-sm">{renderStars(review.rating)}</div>
                          <span className="ml-2 text-sm font-semibold text-gray-800">{review.userName}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
            >
              Close
            </button>
            <a
              href={`/product/${product.id}`}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              View Full Details
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}