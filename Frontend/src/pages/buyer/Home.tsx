import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart } from 'lucide-react';
import api from '../../lib/api';
import { Product } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { ProductCardSkeleton } from '../../components/ui/LoadingSkeleton';

export const Home = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, priceRange]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/getallproducts');
      const raw = response.data || [];
      const normalized: Product[] = raw.map((p: any) => {
        let imgs: any = Array.isArray(p.images)
          ? p.images
          : Array.isArray(p.imageUrls)
          ? p.imageUrls
          : Array.isArray(p.image_urls)
          ? p.image_urls
          : p.images ?? p.imageUrls ?? p.image_urls ?? [];
        if (typeof imgs === 'string') {
          try {
            const parsed = JSON.parse(imgs);
            imgs = Array.isArray(parsed) ? parsed : [String(parsed)];
          } catch {
            imgs = imgs.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        if (!Array.isArray(imgs)) imgs = [];
        return ({
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        // backend may return category as array; use first for display and keep string
        category: Array.isArray(p.category) ? (p.category[0] || '') : (p.category || ''),
        images: imgs,
        sellerId: String(p.sellerId ?? p.seller_id ?? ''),
        sellerName: p.sellerName,
        createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      });
      });
      setProducts(normalized);
      setFilteredProducts(normalized);
      const computedMax = Math.max(0, ...normalized.map((p) => Number(p.price) || 0));
      setMaxPrice(computedMax > 0 ? computedMax : 100000);
      setPriceRange([0, computedMax > 0 ? computedMax : 100000]);
    } catch (error) {
      showToast('error', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    setFilteredProducts(filtered);
  };

  const addToCart = async (productId: string) => {
    try {
      await api.post('/api/cart', { productId, quantity: 1 });
      showToast('success', 'Added to cart!');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const categories = ['all', ...new Set(products.map((p) => p.category || ''))];

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome to MarketPlace</h1>
        <p className="text-indigo-100 text-lg">Discover amazing products from trusted sellers</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="lg:w-64 h-fit">
          <CardBody className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1000, Math.ceil(maxPrice))}
                      step={Math.ceil(Math.max(100, Math.max(1000, Math.ceil(maxPrice)) / 100))}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>₹0</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceRange([0, maxPrice]);
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex-1">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products (e.g., 'phones under 20000')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <p className="text-slate-600">No products found</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} hoverable className="overflow-hidden group">
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-video bg-slate-200 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardBody className="space-y-3">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          ₹{product.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
