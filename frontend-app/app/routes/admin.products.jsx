import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { Link, useNavigate } from 'react-router';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, stock: 0, imageUrl: '', shippingCost: 0, categoryId: '' });
  const [editing, setEditing] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
    loadCategories();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const response = await productService.getAll(1, 100); // Load first 100 products for admin
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5222/api/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await productService.update(editing, { ...form, id: editing });
        setEditing(null);
        alert('Product updated successfully!');
      } else {
        await productService.create(form);
        alert('Product created successfully!');
      }
      setForm({ name: '', description: '', price: 0, stock: 0, imageUrl: '', shippingCost: 0, categoryId: '' });
      loadProducts();
    } catch (error) {
      console.error('Product operation failed:', error);
      alert(error.message || 'Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditing(product.id);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      try {
        await productService.delete(id);
        loadProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Delete product failed:', error);
        alert(error.message || 'Failed to delete product. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: 0, stock: 0, imageUrl: '', shippingCost: 0, categoryId: '' });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (editingCategory) {
        const response = await fetch(`http://localhost:5222/api/categories/${editingCategory}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ ...categoryForm, id: editingCategory })
        });

        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update category');
        }

        setEditingCategory(null);
      } else {
        const response = await fetch('http://localhost:5222/api/categories', {
          method: 'POST',
          headers,
          body: JSON.stringify(categoryForm)
        });

        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create category');
        }
      }
      
      setCategoryForm({ name: '', description: '' });
      setShowCategoryModal(false);
      loadCategories();
      alert(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
    } catch (err) {
      console.error('Category operation failed:', err);
      alert(err.message || 'Failed to save category');
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({ name: category.name, description: category.description });
    setEditingCategory(category.id);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Delete this category? Products with this category will be uncategorized.')) {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch(`http://localhost:5222/api/categories/${id}`, { 
          method: 'DELETE',
          headers 
        });

        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete category');
        }

        loadCategories();
        loadProducts();
        alert('Category deleted successfully!');
      } catch (err) {
        console.error('Delete category failed:', err);
        alert(err.message || 'Failed to delete category');
      }
    }
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Responsive Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h2 className="text-lg md:text-2xl font-bold text-white">Admin Panel</h2>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/admin/dashboard" className="text-white hover:text-blue-200 transition">Dashboard</Link>
              <Link to="/admin/products" className="text-white font-semibold border-b-2 border-white">Products</Link>
              <Link to="/admin/orders" className="text-white hover:text-blue-200 transition">Orders</Link>
              <Link to="/" className="text-white hover:text-blue-200 transition">View Store</Link>
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
              className="md:hidden text-white hover:text-blue-200 transition p-2"
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
              <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-800 rounded-b-lg">
                <Link
                  to="/admin/dashboard"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏠 Dashboard
                </Link>
                <Link
                  to="/admin/products"
                  className="text-white bg-blue-700 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📦 Products
                </Link>
                <Link
                  to="/admin/orders"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  📋 Orders
                </Link>
                <Link
                  to="/"
                  className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏪 View Store
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manage Products</h1>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
          >
            🏷️ Manage Categories
          </button>
        </div>

        {/* Product Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editing ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter product description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (R) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Cost (R)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.shippingCost || 0}
                  onChange={(e) => setForm({ ...form, shippingCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={form.categoryId || ''}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                {editing ? '💾 Update Product' : '➕ Add Product'}
              </button>
              {editing && (
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white">Product List ({products.length})</h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No products yet. Add your first product above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-2xl mr-4">
                              📦
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-800">{product.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No category</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-blue-600">R{product.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{product.stock}</span>
                      </td>
                      <td className="px-6 py-4">
                        {product.stock > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ✗ Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Manage Categories</h2>
              <button
                onClick={handleCancelCategory}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Category Form */}
            <form onSubmit={handleCategorySubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Electronics, Clothing"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelCategory}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Categories List */}
            <div>
              <h3 className="text-xl font-bold mb-4">Existing Categories ({categories.length})</h3>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No categories yet. Add your first category above!</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                    >
                      <div>
                        <div className="font-semibold text-gray-800">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
