import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import api from '../../lib/api';
import { Product } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';

export const SellerProducts = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: [] as File[],
    previewImages: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/getallproducts');
      const raw = response.data || [];
      const normalized: Product[] = raw.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        category: Array.isArray(p.category) ? (p.category[0] || '') : (p.category || ''),
        images: p.imageUrls || p.image_urls || [],
        sellerId: String(p.sellerId ?? p.seller_id ?? ''),
        createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      }));
      const sellerOnly = user ? normalized.filter((p) => p.sellerId === String(user.id)) : normalized;
      setProducts(sellerOnly);
    } catch (error) {
      showToast('error', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      images: [],
      previewImages: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      images: [],
      previewImages: product.images || [],
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 5) : [];
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      images: files,
      previewImages: newPreviews,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('stock', formData.stock);
      form.append('category', formData.category);

      formData.images.forEach((file) => {
        form.append('images', file);
      });

      if (editingProduct) {
        await api.put(`/api/products/update/${editingProduct.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('success', 'Product updated successfully');
      } else {
        await api.post('/api/products/create', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('success', 'Product created successfully');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/api/products/delete/${id}`);
      showToast('success', 'Product deleted successfully');
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to delete product');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No products yet</h2>
            <p className="text-slate-600 mb-4">Start by adding your first product</p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Your Products</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-600 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          ₹{product.price.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className={`font-medium ${
                            product.stock > 10
                              ? 'text-green-600'
                              : product.stock > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {product.stock}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter product name"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />

            <Input
              label="Stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              min="0"
              placeholder="0"
            />
          </div>

          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            placeholder="e.g., Electronics, Fashion, Books"
          />

          {/* Image Upload Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upload Images (Max 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">You can upload up to 5 images</p>

            {/* Preview Selected Images */}
            {formData.previewImages.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {formData.previewImages.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={src}
                      className="h-20 w-full object-cover rounded-lg"
                      alt={`preview-${idx}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          previewImages: prev.previewImages.filter((_, i) => i !== idx),
                          images: prev.images.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
