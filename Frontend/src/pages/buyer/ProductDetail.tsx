import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, User, Package } from 'lucide-react';
import api from '../../lib/api';
import { Product } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSkeleton';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      const p = response.data;
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
      const normalized: Product = {
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        category: Array.isArray(p.category) ? (p.category[0] || '') : (p.category || ''),
        images: imgs,
        sellerId: String(p.sellerId ?? p.seller_id ?? ''),
        sellerName: p.sellerName,
        createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      };
      setProduct(normalized);
    } catch (error) {
      showToast('error', 'Failed to load product');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await api.post('/api/cart', { productId: id, quantity });
      showToast('success', 'Added to cart!');
      navigate('/cart');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-slate-600">Product not found</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-slate-200">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No image
                </div>
              )}
            </div>
          </Card>

          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-indigo-600 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              {product.category}
            </div>
          </div>

          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-4 py-3 border-y border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">
                    {product.stock > 0 ? (
                      <span className="text-green-600">{product.stock} in stock</span>
                    ) : (
                      <span className="text-red-600">Out of stock</span>
                    )}
                  </span>
                </div>
              </div>

              {product.stock > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold text-slate-900 w-12 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button size="lg" className="w-full" onClick={addToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {product.sellerName && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Sold by</p>
                    <p className="font-semibold text-slate-900">{product.sellerName}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Product Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
