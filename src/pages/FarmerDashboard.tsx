import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Upload,
  ArrowRight,
  DollarSign,
  MessageSquare,
  Truck,
  Leaf,
  Sprout,
  RotateCcw,
  XCircle,
  LogOut,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Product, Order, OrderStatus, ProductCategory, UserRole } from '../types';
import { CATEGORIES } from '../lib/initialData';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { farmerService } from '../services/farmerService';
import { userService } from '../services/userService';
import {
  uploadProductImage,
  uploadProfilePicture,
  validateImageFile,
  fileToDataUrl,
} from '../services/imageUploadService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface FarmerDashboardProps {
  onNavigateToChat: (recipientId: string, recipientName: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: UserRole) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onNavigateToChat, onOpenAuth }) => {
  const { user, updateProfile, logout } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'sales' | 'profile'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for Product Add / Edit
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    teluguName: '',
    category: 'vegetables' as ProductCategory,
    description: '',
    descriptionTe: '',
    pricePerKg: 30,
    availableQtyKg: 100,
    unit: 'kg',
    harvestDate: new Date().toISOString().split('T')[0],
    isOrganic: false,
    deliveryOptions: 'both' as 'pickup' | 'delivery' | 'both',
    imageUrl: '',
  });

  // Verification request status toast & resubmission
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitForm, setResubmitForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    farmAddress: '',
    village: '',
    mandal: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    farmingExperience: 10,
    bio: '',
  });

  // Keep resubmit form initialized with current user profile
  useEffect(() => {
    if (user) {
      setResubmitForm({
        fullName: user.fullName || '',
        mobile: user.mobile || '',
        email: user.email || '',
        farmAddress: user.farmAddress || '',
        village: user.village || '',
        mandal: user.mandal || '',
        district: user.district || '',
        state: user.state || 'Andhra Pradesh',
        pincode: user.pincode || '',
        farmingExperience: user.farmingExperience || 10,
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleResubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await farmerService.resubmitVerification(user.id, resubmitForm);
      updateProfile({
        ...resubmitForm,
        isVerified: false,
        verificationStatus: 'pending',
        rejectionReason: '',
      });
      setResubmitModalOpen(false);
      alert(
        language === 'te'
          ? 'మీ ప్రొఫైల్ వివరాలు సవరించబడ్డాయి మరియు అడ్మిన్ పరిశీలనకు మళ్లీ సమర్పించబడ్డాయి ✓'
          : 'Profile details updated and resubmitted for Admin verification ✓'
      );
    } catch (err: any) {
      alert('Resubmission error: ' + err.message);
    }
  };

  // Feature 1: Product Image Upload State
  const productFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);
  const [productUploadProgress, setProductUploadProgress] = useState(0);
  const [productImageError, setProductImageError] = useState('');
  const [productActionSuccessMsg, setProductActionSuccessMsg] = useState('');

  // Feature 2: Profile Picture (Profile DP) Upload State
  const profileFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isUploadingProfileImg, setIsUploadingProfileImg] = useState(false);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [profileImageError, setProfileImageError] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Product Image Selection Handler
  const handleProductFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductImageError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, language);
    if (!validation.valid) {
      setProductImageError(language === 'te' ? (validation.errorTe || validation.error!) : validation.error!);
      return;
    }

    setProductImageFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setProductImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setProductImageError('Failed to read crop image preview.');
    }
  };

  const handleRemoveProductImage = () => {
    setProductImageFile(null);
    setProductImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setProductImageError('');
    if (productFileInputRef.current) productFileInputRef.current.value = '';
  };

  // Profile Picture Selection Handler
  const handleProfileFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImageError('');
    setProfileSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, language);
    if (!validation.valid) {
      setProfileImageError(language === 'te' ? (validation.errorTe || validation.error!) : validation.error!);
      return;
    }

    setProfileImageFile(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfileImagePreview(dataUrl);
    } catch (err) {
      setProfileImageError('Failed to read profile image preview.');
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!profileImageFile || !user) return;
    setIsUploadingProfileImg(true);
    setProfileUploadProgress(10);
    setProfileImageError('');
    setProfileSuccessMsg('');

    try {
      const downloadUrl = await uploadProfilePicture(
        profileImageFile,
        user.id,
        (pct) => setProfileUploadProgress(pct)
      );

      // Save to Firestore user & farmer doc
      await userService.updateUserProfilePhoto(user.id, downloadUrl);

      // Update active user profile state in AuthContext
      updateProfile({ avatarUrl: downloadUrl });

      setProfileImageFile(null);
      setProfileImagePreview(null);
      setProfileSuccessMsg(
        language === 'te'
          ? 'ప్రొఫైల్ చిత్రం విజయవంతంగా అప్‌లోడ్ చేయబడింది ✓'
          : 'Profile picture uploaded successfully! ✓'
      );
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('[Profile Upload Error]:', err);
      setProfileImageError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsUploadingProfileImg(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;
    const defaultAvatar = 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200';
    try {
      await userService.updateUserProfilePhoto(user.id, defaultAvatar);
      updateProfile({ avatarUrl: defaultAvatar });
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setProfileSuccessMsg(language === 'te' ? 'ప్రొఫైల్ ఫోటో తొలగించబడింది.' : 'Profile picture removed.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err: any) {
      setProfileImageError('Failed to remove profile photo.');
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleStorageUpdate = () => loadDashboardData();
    window.addEventListener('farmconnect_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('farmconnect_storage_update', handleStorageUpdate);
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const farmerId = user?.id || 'farmer-1';
      const [allProducts, allOrders] = await Promise.all([
        productService.getAll(),
        orderService.getAll(),
      ]);
      setProducts(allProducts.filter((p) => p.farmerId === farmerId));
      setOrders(allOrders.filter((o) => o.farmerId === farmerId));
    } finally {
      setLoading(false);
    }
  };

  // Open add modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductImageError('');
    setProductUploadProgress(0);
    setFormData({
      name: '',
      teluguName: '',
      category: 'vegetables',
      description: '',
      descriptionTe: '',
      pricePerKg: 35,
      availableQtyKg: 200,
      unit: 'kg',
      harvestDate: new Date().toISOString().split('T')[0],
      isOrganic: false,
      deliveryOptions: 'both',
      imageUrl: '',
    });
    setProductModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductImageFile(null);
    setProductImagePreview(p.images[0] || null);
    setProductImageError('');
    setProductUploadProgress(0);
    setFormData({
      name: p.name,
      teluguName: p.teluguName,
      category: p.category,
      description: p.description,
      descriptionTe: p.descriptionTe || '',
      pricePerKg: p.pricePerKg,
      availableQtyKg: p.availableQtyKg,
      unit: p.unit,
      harvestDate: p.harvestDate,
      isOrganic: p.isOrganic,
      deliveryOptions: p.deliveryOptions,
      imageUrl: p.images[0] || '',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingProductImg) return; // Prevent duplicate uploads or submissions
    setProductImageError('');

    // Mandatory image validation check
    if (!productImagePreview && !formData.imageUrl && !productImageFile) {
      setProductImageError(
        language === 'te'
          ? 'పంట ఫోటో అప్‌లోడ్ చేయడం తప్పనిసరి. దయచేసి "Upload from Gallery" పై క్లిక్ చేసి ఒక చిత్రాన్ని ఎంచుకోండి.'
          : 'Product crop photo is required. Please click "Upload from Gallery" to select an image.'
      );
      return;
    }

    const farmerId = user?.id || 'farmer-1';
    const farmerName = user?.fullName || 'Venkata Subba Reddy';

    let finalImageUrl = formData.imageUrl || productImagePreview || '';

    if (productImageFile) {
      setIsUploadingProductImg(true);
      setProductUploadProgress(10);
      try {
        finalImageUrl = await uploadProductImage(
          productImageFile,
          farmerId,
          editingProduct?.id,
          (pct) => setProductUploadProgress(pct)
        );
      } catch (err: any) {
        console.error('[Product Upload Error]:', err);
        setProductImageError(err.message || 'Failed to upload product image');
        setIsUploadingProductImg(false);
        return;
      } finally {
        setIsUploadingProductImg(false);
      }
    }

    if (!finalImageUrl) {
      setProductImageError('Product image is required.');
      return;
    }

    if (editingProduct) {
      await productService.update({
        ...editingProduct,
        name: formData.name,
        teluguName: formData.teluguName,
        category: formData.category,
        description: formData.description,
        descriptionTe: formData.descriptionTe,
        pricePerKg: Number(formData.pricePerKg),
        availableQtyKg: Number(formData.availableQtyKg),
        unit: formData.unit,
        harvestDate: formData.harvestDate,
        isOrganic: formData.isOrganic,
        deliveryOptions: formData.deliveryOptions,
        images: [finalImageUrl],
        status: Number(formData.availableQtyKg) > 0 ? 'available' : 'out_of_stock',
      });
    } else {
      await productService.create({
        farmerId,
        farmerName,
        farmerVillage: user?.village || 'Tenali Rural',
        farmerMandal: user?.mandal || 'Tenali',
        farmerDistrict: user?.district || 'Guntur',
        farmerState: user?.state || 'Andhra Pradesh',
        farmerVerified: Boolean(user?.isVerified),
        farmerPhone: user?.mobile || '+91 98480 12345',
        name: formData.name,
        teluguName: formData.teluguName || formData.name,
        category: formData.category,
        description: formData.description,
        descriptionTe: formData.descriptionTe,
        pricePerKg: Number(formData.pricePerKg),
        availableQtyKg: Number(formData.availableQtyKg),
        unit: formData.unit,
        harvestDate: formData.harvestDate,
        location: `${user?.village || 'Tenali'}, ${user?.district || 'Guntur'}`,
        isOrganic: formData.isOrganic,
        deliveryOptions: formData.deliveryOptions,
        images: [finalImageUrl],
        status: Number(formData.availableQtyKg) > 0 ? 'available' : 'out_of_stock',
        rating: 5.0,
        reviewCount: 0,
      });
    }

    setProductModalOpen(false);
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductUploadProgress(0);
    setIsUploadingProductImg(false);
    setProductActionSuccessMsg(
      language === 'te'
        ? (editingProduct ? 'పంట వివరాలు విజయవంతంగా నవీకరించబడ్డాయి ✓' : 'కొత్త పంట విజయవంతంగా జోడించబడింది ✓')
        : (editingProduct ? 'Crop listing updated successfully! ✓' : 'New crop listing added successfully! ✓')
    );
    setTimeout(() => setProductActionSuccessMsg(''), 4500);
    await loadDashboardData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(language === 'te' ? 'ఈ పంట వివరాలను తొలగించాలనుకుంటున్నారా?' : 'Are you sure you want to delete this crop listing?')) {
      await productService.delete(productId);
      loadDashboardData();
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    await orderService.updateStatus(orderId, newStatus);
    loadDashboardData();
  };

  // Calculations for dashboard metrics
  const totalProducts = products.length;
  const availableStockKg = products.reduce((sum, p) => sum + p.availableQtyKg, 0);
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'placed' || o.status === 'accepted' || o.status === 'preparing');
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const totalEarnings = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-stone-50 pb-24 pt-12">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">
              {language === 'te' ? 'రైతు నిర్వహణ కేంద్రం' : 'Farmer Management Center'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {language === 'te'
                ? 'పంటలను అప్‌లోడ్ చేయడానికి, ఆర్డర్‌లను స్వీకరించడానికి మరియు మీ అమ్మకాలను నిర్వహించడానికి దయచేసి రైతుగా లాగిన్ అవ్వండి లేదా కొత్త ప్రొఫైల్ నమోదు చేసుకోండి.'
                : 'Please log in with your farmer profile or register a new farmer account to manage crop listings, view incoming orders, and track earnings.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onOpenAuth?.('login', 'farmer')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-colors shadow-xs"
              >
                {t('navLogin')}
              </button>
              <button
                onClick={() => onOpenAuth?.('register', 'farmer')}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl transition-colors"
              >
                Create Farmer Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200'}
                alt={user.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-stone-900">{user.fullName}</h1>
                {(user.verificationStatus === 'verified' || user.isVerified) ? (
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    {t('verifiedFarmer')}
                  </span>
                ) : user.verificationStatus === 'rejected' ? (
                  <span className="text-[11px] font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Verification Rejected
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {user.village || 'Tenali Rural'}, {user.mandal || 'Tenali'}, {user.district || 'Guntur'}, {user.state || 'Andhra Pradesh'}
                </span>
                <span>•</span>
                <span>Experience: {user.farmingExperience || 18} years</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all transform hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addNewProduct')}</span>
            </button>

            <button
              onClick={logout}
              className="bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs sm:text-sm font-bold px-3.5 py-2.5 sm:py-3 rounded-2xl border border-stone-200 transition-colors flex items-center gap-1.5"
              title="Logout from Farmer Dashboard"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Product Action Success Feedback Banner */}
        {productActionSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-extrabold animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{productActionSuccessMsg}</span>
          </div>
        )}

        {/* Dynamic Verification Status Alert Banner */}
        {(user.verificationStatus === 'verified' || user.isVerified) ? (
          <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 rounded-3xl border border-emerald-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {language === 'te' ? '🟢 ధృవీకరించబడిన రైతు ప్రొఫైల్' : '🟢 Verified Farmer Account'}
                  </h3>
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Official Badge</span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {language === 'te'
                    ? 'మీ ప్రొఫైల్ విజయవంతంగా ధృవీకరించబడింది. మీ అన్ని పంటలకు ప్లాట్‌ఫారమ్‌లో ప్రాధాన్యత లభిస్తుంది.'
                    : 'Your farm profile and credentials have been verified by FarmConnect Administration. Your harvests carry the trusted Green Badge.'}
                </p>
              </div>
            </div>
          </div>
        ) : user.verificationStatus === 'rejected' ? (
          <div className="mb-8 p-5 bg-gradient-to-r from-rose-50 via-red-50 to-rose-100 rounded-3xl border border-rose-300 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {language === 'te' ? '🔴 పరిశీలన నిరాకరించబడింది (Verification Rejected)' : '🔴 Verification Rejected'}
                  </h3>
                  <span className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Action Required</span>
                </div>
                {user.rejectionReason && (
                  <p className="text-xs text-rose-950 font-bold mt-1.5 bg-white/90 p-2.5 rounded-xl border border-rose-200">
                    Admin Review Note: "{user.rejectionReason}"
                  </p>
                )}
                <p className="text-[11px] text-stone-600 mt-1">
                  {language === 'te'
                    ? 'దయచేసి క్రింది "వివరాలను సవరించి మళ్లీ సమర్పించండి" బటన్‌ను ఉపయోగించి వివరాలను సరిచేసి ఆమోదం కోసం మళ్లీ పంపండి.'
                    : 'Please update your registration details below and click "Correct Details & Resubmit" to re-trigger Admin review.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setResubmitModalOpen(true)}
              className="bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs px-4 py-3 rounded-2xl transition-all shadow-md shadow-rose-700/20 shrink-0 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'te' ? 'వివరాలను సవరించి మళ్లీ సమర్పించండి' : 'Correct Details & Resubmit'}</span>
            </button>
          </div>
        ) : (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 rounded-3xl border border-amber-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {language === 'te' ? '🟡 పరిపాలనా విచారణలో ఉంది (Verification Pending)' : '🟡 Profile Verification Pending Review'}
                  </h3>
                  <span className="bg-amber-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">Under Audit</span>
                </div>
                <p className="text-xs text-stone-700 mt-1">
                  {language === 'te'
                    ? 'మీ ప్రొఫైల్ వివరాలు ప్లాట్‌ఫారమ్ అడ్మిన్ పరిశీలనలో ఉన్నాయి. పరిశీలన పూర్తయిన తర్వాత మీ గ్రీన్ బ్యాడ్జ్ ఆటోమేటిక్‌గా యాక్టివేట్ అవుతుంది.'
                    : 'Your profile registration details are currently under review by FarmConnect Government & Platform Administration. Your listings remain active during review.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 8 Stats Metrics Grid (Section 5 requirement) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('statTotalProducts')}
              </span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">{totalProducts}</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('statAvailableStock')}
              </span>
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{availableStockKg} kg</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('statPendingOrders')}
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{pendingOrders.length}</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('statTotalEarnings')}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">₹{totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-6 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t('navMyProducts')} ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>{t('incomingOrders')}</span>
            {pendingOrders.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'sales'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t('salesAnalytics')}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {language === 'te' ? 'రైతు ప్రొఫైల్ & ధృవీకరణ' : 'Farm Profile & Verification'}
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-stone-800">
                {language === 'te' ? 'మీరు విక్రయానికి ఉంచిన పంటలు' : 'Your Live Agricultural Listings'}
              </h3>
              <button
                onClick={handleOpenAdd}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addNewProduct')}</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h4 className="font-bold text-stone-800 text-base">
                  {language === 'te' ? 'ఇంకా ఎటువంటి పంటలను జోడించలేదు' : 'No agricultural crops uploaded yet'}
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  {language === 'te'
                    ? 'వినియోగదారులకు నేరుగా విక్రయించడానికి మీ పొలంలో పండిన పంటలను అప్‌లోడ్ చేయండి.'
                    : 'Start uploading your harvested crops to reach thousands of direct buyers.'}
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                >
                  {t('addNewProduct')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 bg-stone-100 overflow-hidden">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        {p.isOrganic && (
                          <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Organic
                          </span>
                        )}
                        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          p.availableQtyKg > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.availableQtyKg > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {p.category}
                        </span>
                        <h4 className="font-bold text-stone-900 text-base line-clamp-1 mt-0.5">
                          {language === 'te' ? p.teluguName : p.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.description}</p>

                        <div className="grid grid-cols-2 gap-2 my-3 pt-2 border-t border-stone-100 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Price</span>
                            <span className="font-extrabold text-stone-900 text-sm">₹{p.pricePerKg} / {p.unit}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Stock Available</span>
                            <span className="font-bold text-emerald-700">{p.availableQtyKg} {p.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Listing</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCOMING ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-stone-800">
              {language === 'te' ? 'వినియోగదారుల నుండి వచ్చిన ఆర్డర్లు' : 'Customer Orders & Fulfilment'}
            </h3>

            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h4 className="font-bold text-stone-800 text-base">No orders yet</h4>
                <p className="text-xs text-stone-500 mt-1">
                  When consumers place orders for your crops, they will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            Order #{order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'placed'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-stone-400 block">Total Amount</span>
                        <span className="text-lg font-black text-emerald-800">₹{order.finalAmount}</span>
                      </div>
                    </div>

                    {/* Customer Info for fulfillment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-3.5 rounded-2xl text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Customer Information</span>
                        <p className="font-bold text-stone-800 mt-0.5">{order.customerName}</p>
                        <p className="text-stone-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{order.customerPhone}</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Delivery Address</span>
                        <p className="text-stone-700 mt-0.5">
                          {order.deliveryAddress.addressLine}, {order.deliveryAddress.village}, {order.deliveryAddress.district} - {order.deliveryAddress.pincode}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Ordered Items:</span>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-stone-800">
                            {language === 'te' ? item.productTeluguName : item.productName} × {item.quantityKg} {item.unit}
                          </span>
                          <span className="font-bold text-stone-900">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Fulfillment Actions */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => onNavigateToChat(order.customerId, order.customerName)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Customer</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'placed' && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                            >
                              {t('acceptOrder')}
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                            >
                              {t('rejectOrder')}
                            </button>
                          </>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors"
                          >
                            Mark Preparing Harvest
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors"
                          >
                            Mark Ready for Pickup / Dispatch
                          </button>
                        )}

                        {order.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Shipped</span>
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SALES & EARNINGS ANALYTICS */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
              <h3 className="font-extrabold text-base text-stone-900 mb-4">{t('salesAnalytics')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Daily Average</span>
                  <p className="text-2xl font-black text-emerald-950 mt-1">₹1,240</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                  <span className="text-xs font-bold text-teal-800 uppercase">Weekly Total</span>
                  <p className="text-2xl font-black text-teal-950 mt-1">₹8,680</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-600 uppercase">Total Completed Revenue</span>
                  <p className="text-2xl font-black text-stone-900 mt-1">₹{totalEarnings.toLocaleString()}</p>
                </div>
              </div>

              {/* Visual Simulated Bar Chart */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Product-wise Revenue Breakdown
                </span>
                {products.map((p) => {
                  const estSales = (p.pricePerKg * 15) % 2500 + 400;
                  const pct = Math.min(100, Math.round((estSales / 3000) * 100));
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-700">
                        <span>{language === 'te' ? p.teluguName : p.name}</span>
                        <span>₹{estSales}</span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FARMER PROFILE & VERIFICATION */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-stone-900">
                {language === 'te' ? 'రైతు ప్రొఫైల్ మరియు పత్రాల ధృవీకరణ' : 'Farmer Profile & Verification Status'}
              </h3>
              <p className="text-xs text-stone-500">
                {language === 'te'
                  ? 'ప్రభుత్వ ధృవీకరణ బ్యాడ్జ్ పొందడం ద్వారా కస్టమర్లలో నమ్మకం పెరుగుతుంది మరియు మీ అమ్మకాలు వృద్ధి చెందుతాయి.'
                  : 'Verified farmers earn the verified green badge, building higher buyer trust and increasing direct purchases.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              (user?.verificationStatus === 'verified' || user?.isVerified)
                ? 'bg-emerald-50 border-emerald-200'
                : user?.verificationStatus === 'rejected'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {(user?.verificationStatus === 'verified' || user?.isVerified) ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : user?.verificationStatus === 'rejected' ? (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                ) : (
                  <Clock className="w-8 h-8 text-amber-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">
                    {(user?.verificationStatus === 'verified' || user?.isVerified)
                      ? 'Certified & Verified Farmer Account (ధృవీకరించబడిన రైతు)'
                      : user?.verificationStatus === 'rejected'
                      ? 'Verification Rejected (నిరాకరించబడింది)'
                      : 'Verification Pending Review (విచారణలో ఉంది)'}
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {(user?.verificationStatus === 'verified' || user?.isVerified)
                      ? 'Your land records and agricultural credentials have been verified by FarmConnect Administration.'
                      : user?.verificationStatus === 'rejected'
                      ? `Rejection Reason: "${user?.rejectionReason || 'Please review and correct your details.'}"`
                      : 'Your registration details are currently under review by FarmConnect Administration.'}
                  </p>
                </div>
              </div>

              {user?.verificationStatus === 'rejected' ? (
                <button
                  onClick={() => setResubmitModalOpen(true)}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Resubmit Verification</span>
                </button>
              ) : !(user?.verificationStatus === 'verified' || user?.isVerified) ? (
                <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-200">
                  Audit in Progress
                </span>
              ) : null}
            </div>

            {/* Feature 2: Profile Picture (Profile DP) Upload Card - Matching exact UI design */}
            <div className="p-5 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-4">
              <input
                type="file"
                ref={profileFileInputRef}
                onChange={handleProfileFileSelect}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Profile DP Avatar Preview Container */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 bg-stone-100 shadow-md flex items-center justify-center shrink-0">
                    <img
                      src={profileImagePreview || user?.avatarUrl || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200'}
                      alt={user?.fullName || 'Farmer DP'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors"
                    title={language === 'te' ? 'ఫోటో మార్చండి' : 'Change photo'}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Profile Photo Details & Actions matching screenshot */}
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                      {language === 'te' ? 'ప్రొఫైల్ ఫోటో (ఐచ్ఛికం)' : 'Profile photograph (Optional)'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      JPEG, PNG, or WebP. Up to 5 MB.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => profileFileInputRef.current?.click()}
                      className="border border-stone-300 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>{language === 'te' ? 'గ్యాలరీ నుండి అప్‌లోడ్ చేయండి' : 'Upload from Gallery'}</span>
                    </button>

                    {profileImageFile && (
                      <button
                        type="button"
                        onClick={handleSaveProfilePicture}
                        disabled={isUploadingProfileImg}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        {isUploadingProfileImg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <span>{language === 'te' ? 'సేవ్ చేయండి' : 'Save Profile Picture'}</span>
                        )}
                      </button>
                    )}

                    {user?.avatarUrl && !user.avatarUrl.includes('unsplash') && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="text-stone-500 hover:text-rose-600 font-bold text-xs px-2 py-1 transition-colors"
                      >
                        {language === 'te' ? 'తొలగించు' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar during profile upload */}
              {isUploadingProfileImg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-900">
                    <span>Uploading profile photo...</span>
                    <span>{profileUploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${profileUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Feedback messages */}
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileImageError && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileImageError}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs" id="edit-profile-form">
              <div>
                <label className="font-bold text-stone-600 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={resubmitForm.fullName}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, fullName: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Mobile (Linked to Aadhaar) *</label>
                <input
                  type="text"
                  value={resubmitForm.mobile}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, mobile: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={resubmitForm.email}
                  className="w-full border border-stone-200 bg-stone-100 rounded-xl p-3 text-stone-500 font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Farm / Survey Address</label>
                <input
                  type="text"
                  value={resubmitForm.farmAddress}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, farmAddress: e.target.value })}
                  placeholder="Survey No, Field location"
                  className="w-full border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Village & Mandal *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resubmitForm.village}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, village: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                    placeholder="Village"
                  />
                  <input
                    type="text"
                    value={resubmitForm.mandal}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, mandal: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                    placeholder="Mandal"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">District & State *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resubmitForm.district}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, district: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                    placeholder="District"
                  />
                  <input
                    type="text"
                    value={resubmitForm.state}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, state: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                    placeholder="State"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Farming Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={resubmitForm.farmingExperience}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, farmingExperience: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-stone-600 block mb-1">Farming Bio / Primary Crops</label>
                <input
                  type="text"
                  value={resubmitForm.bio}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, bio: e.target.value })}
                  placeholder="e.g. Paddy, Red Chilli, Vegetables"
                  className="w-full border border-stone-200 rounded-xl p-3 text-stone-900 font-semibold focus:border-emerald-500"
                />
              </div>
            </div>
            
            <button
              onClick={async () => {
                if (!user) return;
                try {
                  await userService.updateUserProfile(user.id, resubmitForm);
                  updateProfile(resubmitForm);
                  setProfileSuccessMsg('Profile updated successfully!');
                  setTimeout(() => setProfileSuccessMsg(''), 3000);
                } catch (err: any) {
                  setProfileImageError('Failed to update profile: ' + err.message);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        )}
      </div>

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingProduct ? t('editProduct') : t('addNewProduct')}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fresh Country Tomatoes"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">పంట పేరు (Telugu) *</label>
                  <input
                    type="text"
                    required
                    value={formData.teluguName}
                    onChange={(e) => setFormData({ ...formData, teluguName: e.target.value })}
                    placeholder="ఉదా: తాజా నాటు టమాటాలు"
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'te' ? cat.nameTe : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Price per kg (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: Number(e.target.value) })}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Available Quantity (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.availableQtyKg}
                    onChange={(e) => setFormData({ ...formData, availableQtyKg: Number(e.target.value) })}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Delivery Options</label>
                  <select
                    value={formData.deliveryOptions}
                    onChange={(e) => setFormData({ ...formData, deliveryOptions: e.target.value as any })}
                    className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="both">Both Farm Pickup & Delivery</option>
                    <option value="delivery">Farmer Delivery Only</option>
                    <option value="pickup">Farm Pickup Only</option>
                  </select>
                </div>
              </div>

              {/* Organic toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-3 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.isOrganic}
                  onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-stone-800">
                  100% Certified Organic / Natural Farming (రసాయనాలు లేని ప్రకృతి వ్యవసాయం)
                </span>
              </label>

              {/* Feature 1: Product Crop Image Upload Section */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'te' ? 'పంట ఫోటో అప్‌లోడ్ * (Crop Photo Required)' : 'Product Crop Image (Mandatory) *'}</span>
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Max 5 MB
                  </span>
                </div>

                <input
                  type="file"
                  ref={productFileInputRef}
                  onChange={handleProductFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />

                {productImagePreview || formData.imageUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-emerald-500 bg-stone-950 max-h-56">
                    <img
                      src={productImagePreview || formData.imageUrl}
                      alt="Product Crop Preview"
                      className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-stone-950/40 flex items-center justify-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity p-2">
                      <button
                        type="button"
                        onClick={() => productFileInputRef.current?.click()}
                        className="bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'te' ? 'చిత్రాన్ని మార్చండి' : 'Change Image'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveProductImage}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'te' ? 'తొలగించు' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => productFileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-white p-6 rounded-2xl text-center cursor-pointer transition-all hover:bg-emerald-50/50 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 flex items-center justify-center mx-auto mb-2 transition-colors shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-extrabold text-stone-900 text-xs sm:text-sm">
                      {language === 'te' ? 'గ్యాలరీ నుండి అప్‌లోడ్ చేయండి' : 'Upload from Gallery'}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {language === 'te' ? 'JPG, JPEG, PNG, WEBP రకాలు. 5 MB వరకు.' : 'Select crop image from mobile phone gallery (JPG, PNG, WEBP up to 5 MB)'}
                    </p>
                    <button
                      type="button"
                      className="mt-3 bg-emerald-700 group-hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'ఫోటో ఎంచుకోండి' : 'Choose Crop Photo'}</span>
                    </button>
                  </div>
                )}

                {isUploadingProductImg && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs font-bold text-emerald-900">
                      <span>Uploading image to Firebase Storage...</span>
                      <span>{productUploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${productUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {productImageError && (
                  <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{productImageError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe crop quality, variety, freshness..."
                  className="w-full border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-xl transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProductImg}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {isUploadingProductImg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'te' ? 'చిత్రం అప్‌లోడ్ అవుతోంది...' : 'Uploading & Saving...'} ({productUploadProgress}%)</span>
                    </>
                  ) : (
                    <span>{t('save')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resubmit Verification Modal */}
      {resubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {language === 'te' ? 'వివరాలను సవరించి మళ్లీ సమర్పించండి' : 'Correct Profile & Resubmit Verification'}
                </h3>
              </div>
              <button
                onClick={() => setResubmitModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResubmitVerification} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className="text-stone-600 text-xs leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
                {language === 'te'
                  ? 'మీ ప్రొఫైల్ వివరాలను సరిచేసి ఆమోదం కోసం అడ్మిన్ టీమ్‌కు మళ్లీ పంపండి.'
                  : 'Update any inaccurate information below. Submitting will reset your status to "Pending Review" for Admin verification.'}
              </p>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={resubmitForm.fullName}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, fullName: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl p-3 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={resubmitForm.mobile}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, mobile: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl p-3 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={resubmitForm.village}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, village: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mandal *</label>
                  <input
                    type="text"
                    required
                    value={resubmitForm.mandal}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, mandal: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={resubmitForm.district}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, district: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={resubmitForm.pincode}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, pincode: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Farming Experience (Years) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={resubmitForm.farmingExperience}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, farmingExperience: Number(e.target.value) })}
                  className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Farm Crops / Profile Description</label>
                <textarea
                  rows={2}
                  value={resubmitForm.bio}
                  onChange={(e) => setResubmitForm({ ...resubmitForm, bio: e.target.value })}
                  placeholder="Describe your land holding, crops cultivated..."
                  className="w-full border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResubmitModalOpen(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-colors shadow-md"
                >
                  Resubmit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
