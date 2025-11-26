import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

export default function AdminInventory() {
  const navigate = useNavigate();
  const [inventoryReport, setInventoryReport] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: 0,
    quantityChange: 0,
    reason: ''
  });
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    loadInventoryReport();
  }, []);

  const loadInventoryReport = async () => {
    try {
      const response = await fetch('http://localhost:5222/api/inventory/report');
      const data = await response.json();
      setInventoryReport(data);
    } catch (err) {
      console.error('Failed to load inventory report', err);
    }
  };

  const loadStockHistory = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5222/api/inventory/history/${productId}`);
      const data = await response.json();
      setStockHistory(data);
    } catch (err) {
      console.error('Failed to load stock history', err);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5222/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentForm)
      });

      if (response.ok) {
        alert('Stock adjusted successfully');
        setShowAdjustModal(false);
        setAdjustmentForm({ productId: 0, quantityChange: 0, reason: '' });
        loadInventoryReport();
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (err) {
      alert('Failed to adjust stock');
    }
  };

  const openAdjustModal = (product) => {
    setAdjustmentForm({
      productId: product.id,
      quantityChange: 0,
      reason: ''
    });
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const viewHistory = (product) => {
    setSelectedProduct(product);
    loadStockHistory(product.id);
  };

  if (!inventoryReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 text-white">
              <span className="text-2xl">📦</span>
              <span className="text-xl font-bold">Admin - Inventory Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/dashboard" className="text-white hover:text-purple-100 transition">
                Dashboard
              </Link>
              <Link to="/admin/products" className="text-white hover:text-purple-100 transition">
                Products
              </Link>
              <Link to="/admin/orders" className="text-white hover:text-purple-100 transition">
                Orders
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  navigate('/admin/login');
                }}
                className="text-white hover:text-purple-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold text-gray-800">{inventoryReport.summary.totalProducts}</div>
            <div className="text-gray-600">Total Products</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-yellow-600">{inventoryReport.summary.lowStockCount}</div>
            <div className="text-gray-600">Low Stock Items</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-600">{inventoryReport.summary.outOfStockCount}</div>
            <div className="text-gray-600">Out of Stock</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-600">R{inventoryReport.summary.totalInventoryValue.toFixed(2)}</div>
            <div className="text-gray-600">Inventory Value</div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Inventory Status</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryReport.products.map((product) => (
                  <tr key={product.id} className={product.isOutOfStock ? 'bg-red-50' : product.isLowStock ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{product.stock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isOutOfStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : product.isLowStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openAdjustModal(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Adjust Stock
                      </button>
                      <button
                        onClick={() => viewHistory(product)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock History */}
        {selectedProduct && stockHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Stock History - {selectedProduct.name}
            </h3>
            <div className="space-y-3">
              {stockHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{entry.reason}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                    </div>
                    <div className="text-xs text-gray-500">Stock: {entry.stockAfter}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Adjust Stock - {selectedProduct?.name}
            </h3>
            <form onSubmit={handleAdjustStock}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Stock: {selectedProduct?.stock}
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity Change
                </label>
                <input
                  type="number"
                  value={adjustmentForm.quantityChange}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantityChange: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter positive or negative number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  New stock will be: {selectedProduct?.stock + adjustmentForm.quantityChange}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Restocking, Damaged goods, Inventory correction"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Adjust Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
