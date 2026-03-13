import { useState, useEffect } from 'react';

export default function ProductComparison({ products, isOpen, onClose, onRemoveProduct }) {
  const [productDetails, setProductDetails] = useState([]);
  const [productRatings, setProductRatings] = useState({});

  useEffect(() => {
    if (isOpen && products.length > 0) {
      loadProductDetails();
      loadProductRatings();
    }
  }, [isOpen, products]);

  const loadProductDetails = async () => {
    try {
      const details = await Promise.all(
        products.map(async (product) => {
          const response = await fetch(`http://localhost:5222/api/products/${product.id}`);
          return await response.json();
        })
      );
      setProductDetails(details);
    } catch (err) {
      console.error('Failed to load product details', err);
    }
  };

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
            ratings[product.id] = { average: 0, count: 0 };
          }
        })
      );
      setProductRatings(ratings);
    } catch (err) {
      console.error('Error loading product ratings:', err);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
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
    // Update cart count if there's a callback
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (!isOpen || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <h2 className="text-2xl font-bold">Product Comparison</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 font-bold text-gray-800 border-b-2">Feature</th>
                  {productDetails.map((product) => (
                    <th key={product.id} className="text-center p-4 border-b-2 min-w-64">
                      <div className="relative">
                        <button
                          onClick={() => onRemoveProduct(product.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="mb-4">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-4xl mx-auto">
                              📦
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">{product.name}</h3>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="border-b">
                  <td className="p-4 font-semibold text-gray-700">Price</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className="text-2xl font-bold text-blue-600">
                        R{product.price?.toFixed(2)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rating Row */}
                <tr className="border-b bg-gray-50">
                  <td className="p-4 font-semibold text-gray-700">Rating</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="flex">
                          {renderStars(productRatings[product.id]?.average || 0)}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          ({productRatings[product.id]?.count || 0})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock Row */}
                <tr className="border-b">
                  <td className="p-4 font-semibold text-gray-700">Availability</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr className="border-b bg-gray-50">
                  <td className="p-4 font-semibold text-gray-700">Description</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {product.description}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Shipping Cost Row */}
                <tr className="border-b">
                  <td className="p-4 font-semibold text-gray-700">Shipping</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <span className="text-gray-600">
                        {product.shippingCost > 0 ? `R${product.shippingCost.toFixed(2)}` : 'Free'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Actions Row */}
                <tr className="bg-gray-50">
                  <td className="p-4 font-semibold text-gray-700">Actions</td>
                  {productDetails.map((product) => (
                    <td key={product.id} className="p-4 text-center">
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className={`w-full py-2 px-4 rounded-lg font-bold text-white transition ${
                            product.stock > 0 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
                        </button>
                        <a
                          href={`/product/${product.id}`}
                          className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition text-center"
                        >
                          View Details
                        </a>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Comparing {productDetails.length} product{productDetails.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}