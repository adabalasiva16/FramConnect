import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ShieldCheck,
  Leaf,
  ShoppingBag,
  Truck,
  Store,
  Scale,
  Star,
  MessageSquare,
  Share2,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Product, Review } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getStoredReviews, addReview as saveReviewToStore } from '../lib/storage';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onNavigateToFarmerChat: (farmerId: string, farmerName: string, productId: string, productName: string) => void;
  onOpenPriceComparison: (cropName: string) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onBack,
  onNavigateToFarmerChat,
  onOpenPriceComparison,
}) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>(() => {
    const all = getStoredReviews();
    return all.filter((r) => r.productId === product.id || r.productName === product.name);
  });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const maxAllowed = Math.min(product.availableQtyKg, 100);

  const handleIncrement = () => {
    if (quantity < maxAllowed) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const review: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      customerId: user?.id || 'cust-demo',
      customerName: user?.fullName || 'Satisfied Consumer',
      customerAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      rating: newRating,
      comment: newComment,
      createdAt: new Date().toISOString(),
    };

    saveReviewToStore(review);
    setReviews([review, ...reviews]);
    setNewComment('');
    setShowReviewForm(false);
  };

  const totalCalculatedPrice = quantity * product.pricePerKg;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-sm bg-white px-4 py-2 rounded-xl border border-stone-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToMarketplace')}</span>
          </button>

          <button
            onClick={() => onOpenPriceComparison(product.name.split(' ')[0])}
            className="flex items-center gap-1.5 text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors"
          >
            <Scale className="w-4 h-4 text-emerald-700" />
            <span>{t('comparePrices')}</span>
          </button>
        </div>

        {/* Main Product Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {product.isOrganic && (
                  <span className="absolute top-4 left-4 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{t('organicCertified')}</span>
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-18 h-18 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Farm Origin Verification Box */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    {language === 'te' ? 'రైతు ప్రామాణికత' : 'Direct Producer Verification'}
                  </span>
                  {product.farmerVerified && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {t('verifiedFarmer')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {product.farmerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{product.farmerName}</h4>
                    <p className="text-xs text-stone-500">
                      {product.farmerVillage}, {product.farmerDistrict}, {product.farmerState}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onNavigateToFarmerChat(product.farmerId, product.farmerName, product.id, product.name)
                  }
                  className="w-full bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('contactFarmer')}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Harvest Info & Purchase Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md">
                    {product.category.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-stone-400">({product.reviewCount} reviews)</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                  {language === 'te' ? product.teluguName : product.name}
                </h1>
                <p className="text-sm font-semibold text-emerald-800 mt-1">
                  {language === 'te' ? product.name : product.teluguName}
                </p>

                {/* Price Display */}
                <div className="my-5 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-stone-500 uppercase font-bold tracking-wider block">
                      {language === 'te' ? 'నేరుగా రైతు ధర' : 'Direct Farm-Gate Price'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-black text-stone-900">₹{product.pricePerKg}</span>
                      <span className="text-sm text-stone-500 font-semibold">/ {product.unit}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 font-semibold block">{t('availableStock')}</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {product.availableQtyKg} {product.unit}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-sm text-stone-700 leading-relaxed">
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                    {language === 'te' ? 'పంట వివరాలు:' : 'Harvest Details & Farming Note:'}
                  </h4>
                  <p>{product.description}</p>
                  {product.descriptionTe && language === 'te' && (
                    <p className="text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                      {product.descriptionTe}
                    </p>
                  )}
                </div>

                {/* Harvest & Delivery Badges */}
                <div className="grid grid-cols-2 gap-3 my-5 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">{t('harvestedOn')}</span>
                      <span className="font-bold text-stone-800">{product.harvestDate}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">{t('deliveryOptions')}</span>
                      <span className="font-bold text-stone-800">
                        {product.deliveryOptions === 'both'
                          ? 'Pickup & Home Delivery'
                          : product.deliveryOptions === 'delivery'
                          ? 'Farmer Delivery'
                          : 'Farm Pickup'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Add To Basket */}
              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-800">{t('orderQuantity')} ({product.unit}):</span>

                  <div className="flex items-center gap-3 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-xl bg-white disabled:opacity-40 flex items-center justify-center font-bold text-stone-700 shadow-xs hover:bg-stone-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-extrabold text-base text-stone-900">
                      {quantity} {product.unit}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= maxAllowed}
                      className="w-8 h-8 rounded-xl bg-white disabled:opacity-40 flex items-center justify-center font-bold text-stone-700 shadow-xs hover:bg-stone-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-base font-extrabold text-stone-900 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                  <span>{t('totalPrice')}:</span>
                  <span className="text-xl text-emerald-800">₹{totalCalculatedPrice}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.availableQtyKg <= 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-98"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{addedToast ? 'Added to Basket!' : t('addToCart')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-xl text-stone-900">{t('customerReviews')}</h3>
              <p className="text-xs text-stone-500">
                {language === 'te' ? 'రైతుల పంట నాణ్యతపై నిజమైన వినియోగదారుల ఫీడ్‌బ్యాక్' : 'Verified feedback on fresh harvest quality from local buyers'}
              </p>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              {showReviewForm ? 'Cancel' : t('writeReview')}
            </button>
          </div>

          {/* New Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-stone-50 rounded-2xl p-5 border border-stone-200 mb-6 space-y-4">
              <h4 className="font-bold text-sm text-stone-800">Share your experience with this harvest</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-600">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="How was the taste, freshness, and delivery?"
                rows={3}
                required
                className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
              >
                Submit Review
              </button>
            </form>
          )}

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">{t('noReviewsYet')}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.customerAvatar}
                        alt={rev.customerName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">{rev.customerName}</span>
                        <span className="text-[10px] text-stone-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
