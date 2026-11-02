import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  FileText,
  DollarSign,
  Activity,
  Award,
  LogOut,
  Lock,
  Filter,
  Eye,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, Product, Order, Review, UserRole } from '../types';
import { farmerService } from '../services/farmerService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { getStoredReviews } from '../lib/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

interface AdminDashboardProps {
  onOpenAuth?: (mode: 'login' | 'register', role?: UserRole) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenAuth }) => {
  const { language, t } = useLanguage();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'orders'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search for Farmers
  const [farmerSearch, setFarmerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Modals
  const [selectedFarmer, setSelectedFarmer] = useState<UserProfile | null>(null);
  const [rejectModalFarmer, setRejectModalFarmer] = useState<UserProfile | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    window.addEventListener('farmconnect_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('farmconnect_storage_update', handleStorageUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, pData, oData] = await Promise.all([
        userService.getAll(),
        productService.getAll(),
        orderService.getAll(),
      ]);
      // Filter out admins from the list of users to be managed
      setUsers(uData.filter(u => u.role !== 'admin'));
      setProducts(pData);
      setOrders(oData);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (u: UserProfile) => {
    console.log('[AdminDashboard] Approving farmer document ID:', u.id, 'Name:', u.fullName);
    const currentStatus = u.verificationStatus || u.approvalStatus || (u.isVerified ? 'approved' : 'pending');
    if (currentStatus === 'approved' || currentStatus === 'verified') {
      setActionSuccessMsg(`${u.fullName} is already approved.`);
      setTimeout(() => setActionSuccessMsg(''), 3000);
      return;
    }
    if (u.role !== 'farmer') return; // Only approve farmers

    try {
      // Update both farmers and users collections
      await farmerService.approveFarmer(u.id, user?.id);
      await userService.updateUserStatus(u.id, 'approved', user?.id);
      console.log('[AdminDashboard] Farmer approved successfully:', u.id);

      // Instantly update local state
      setUsers((prevUsers) =>
        prevUsers.map((usr) =>
          usr.id === u.id
            ? { ...usr, isVerified: true, verificationStatus: 'approved', approvalStatus: 'approved', rejectionReason: '' }
            : usr
        )
      );
      if (selectedFarmer?.id === u.id) {
        setSelectedFarmer((prev) =>
          prev ? { ...prev, isVerified: true, verificationStatus: 'approved', approvalStatus: 'approved', rejectionReason: '' } : null
        );
      }

      setActionSuccessMsg(
        language === 'te'
          ? `రైతు ${u.fullName} విజయవంతంగా ఆమోదించబడ్డారు ✓`
          : `Farmer ${u.fullName} has been approved and verified ✓`
      );
      setTimeout(() => setActionSuccessMsg(''), 4000);

      await loadData();
    } catch (err: any) {
      console.error('[AdminDashboard] Approval error for ID:', u.id, err);
      alert('Approval error: ' + (err?.message || String(err)));
    }
  };

  const handleOpenRejectModal = (farmer: UserProfile) => {
    setRejectModalFarmer(farmer);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalFarmer) return;
    const finalReason = rejectionReasonInput.trim() || 'Land passbook / Identity details require correction.';
    try {
      if (rejectModalFarmer.role === 'farmer') {
        await farmerService.rejectFarmer(rejectModalFarmer.id, finalReason, user?.id);
      }
      await userService.updateUserStatus(rejectModalFarmer.id, 'rejected', user?.id, finalReason);
      setActionSuccessMsg(
        language === 'te'
          ? `${rejectModalFarmer.fullName} ప్రొఫైల్ నిరాకరించబడింది.`
          : `User ${rejectModalFarmer.fullName} profile marked as Rejected.`
      );
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setRejectModalFarmer(null);
      loadData();
      if (selectedFarmer?.id === rejectModalFarmer.id) {
        setSelectedFarmer((prev) => (prev ? { ...prev, isVerified: false, verificationStatus: 'rejected', rejectionReason: finalReason } : null));
      }
    } catch (err: any) {
      alert('Rejection error: ' + err.message);
    }
  };

  const handleDeleteProductAdmin = async (productId: string) => {
    if (window.confirm('As administrator, do you wish to remove this listing for compliance?')) {
      await productService.delete(productId);
      loadData();
    }
  };

  const totalGMV = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  // Only farmers need admin approval — customers are auto-approved
  const farmersOnly = users.filter((u) => u.role === 'farmer');
  const pendingCount = farmersOnly.filter((u) => {
    const vs = u.verificationStatus || (u.isVerified ? 'approved' : 'pending');
    return vs === 'pending';
  }).length;
  const verifiedCount = farmersOnly.filter((u) => {
    const vs = u.verificationStatus || (u.isVerified ? 'approved' : 'pending');
    return vs === 'approved' || vs === 'verified';
  }).length;
  const rejectedCount = farmersOnly.filter((u) => {
    const vs = u.verificationStatus || (u.isVerified ? 'approved' : 'pending');
    return vs === 'rejected';
  }).length;

  // Filtered users list — ONLY farmers shown for approval actions
  const filteredUsers = farmersOnly.filter((u) => {
    const vStatus = u.verificationStatus || (u.isVerified ? 'approved' : 'pending');
    if (statusFilter !== 'all' && vStatus !== statusFilter && !(statusFilter === 'verified' && vStatus === 'approved')) return false;
    if (farmerSearch.trim()) {
      const q = farmerSearch.toLowerCase().trim();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.mobile.includes(q);
      const matchLocation = `${u.village} ${u.mandal} ${u.district} ${u.state}`.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchLocation;
    }
    return true;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-md text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">
            {language === 'te' ? 'అడ్మిన్ లాగిన్ అవసరం' : 'Administrator Access Required'}
          </h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {language === 'te'
              ? 'ఈ కంట్రోల్ ప్యానెల్ ధృవీకరించబడిన ప్రభుత్వ లేదా ప్లాట్‌ఫారమ్ నిర్వాహకులకు మాత్రమే కేటాయించబడింది. దయచేసి మీ అడ్మిన్ ఖాతాతో లాగిన్ అవ్వండి.'
              : 'This governance console is restricted to regulatory and platform authorities. Please sign in with an Administrator profile.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onOpenAuth?.('login', 'admin')}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              {language === 'te' ? 'అడ్మిన్ ఖాతాలోకి లాగిన్ అవ్వండి' : 'Sign In as Administrator'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-6">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                  Government & Platform Authority
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{t('adminTitle')}</h1>
              <p className="text-xs sm:text-sm text-stone-300">
                {language === 'te'
                  ? 'రైతుల ధృవీకరణ, పంటల పర్యవేక్షణ, ఆర్డర్ వివాదాల పరిష్కారం మరియు లావాదేవీల విశ్లేషణ'
                  : 'Farmer approval governance, verification auditing & platform control'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-emerald-300">{user.fullName}</p>
              <p className="text-[10px] text-stone-300">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'te' ? 'లాగ్ అవుట్' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {actionSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-extrabold animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase text-stone-500">Total Users</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-stone-900">{users.length}</p>
            <span className="text-[10px] text-stone-500 font-semibold">Farmers & Customers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase text-stone-500">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting admin verification</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase text-stone-500">Verified Farmers</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{verifiedCount}</p>
            <span className="text-[10px] text-emerald-800 font-semibold">Official Green Badge</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase text-stone-500">Rejected Profiles</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-600">{rejectedCount}</p>
            <span className="text-[10px] text-rose-700 font-semibold">Resubmission allowed</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 mb-6 gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>User Approval & Verification ({users.length})</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingCount} Pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog Moderation ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Platform Orders ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT & APPROVAL */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-lg text-stone-900">
                  {language === 'te' ? 'యూజర్ ఖాతాల పరిశీలన మరియు అడ్మిన్ ఆమోదం' : 'User Directory & Verification Console'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Audit registered users (Farmers & Customers), view details, and manage platform verification.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  placeholder={language === 'te' ? 'పేరు, ఇమెయిల్ లేదా ఫోన్ శోధించండి...' : 'Search name, email, phone...'}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="text-stone-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review ({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('verified')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  statusFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified ({verifiedCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected ({rejectedCount})</span>
              </button>
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center bg-stone-50 rounded-2xl border border-stone-200/80">
                <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="font-bold text-stone-700 text-sm">
                  {language === 'te' ? 'ఎటువంటి యూజర్ల వివరాలు దొరకలేదు' : 'No users match the selected filter.'}
                </p>
                <p className="text-xs text-stone-400 mt-1">Try changing your search term or status filter tab.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const vStatus = u.verificationStatus || u.approvalStatus || (u.isVerified ? 'approved' : 'pending');
                  const isApproved = vStatus === 'approved' || vStatus === 'verified';
                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 hover:border-emerald-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200'}
                          alt={u.fullName}
                          className={`w-13 h-13 rounded-2xl object-cover border-2 shrink-0 ${u.role === 'farmer' ? 'border-emerald-500' : 'border-blue-500'}`}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{u.fullName}</span>
                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${u.role === 'farmer' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {u.role}
                            </span>
                            {isApproved && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Approved
                              </span>
                            )}
                            {!isApproved && vStatus === 'pending' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Pending
                              </span>
                            )}
                            {!isApproved && vStatus === 'rejected' && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Rejected
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-600 font-medium mt-1">
                            📍 {u.village}, {u.mandal}, {u.district}, {u.state}
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            ✉️ {u.email} • 📞 {u.mobile} {u.role === 'farmer' && `• Exp: ${u.farmingExperience || 10} yrs`}
                          </p>
                          {vStatus === 'rejected' && u.rejectionReason && (
                            <p className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              Rejection Reason: {u.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedFarmer(u)}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {vStatus !== 'approved' && vStatus !== 'verified' && (
                          <button
                            onClick={() => handleApproveUser(u)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {vStatus !== 'rejected' && (
                          <button
                            onClick={() => handleOpenRejectModal(u)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG MODERATION */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900">
              {language === 'te' ? 'ఉత్పత్తుల కేటలాగ్ నియంత్రణ' : 'Catalog Moderation & Compliance'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex gap-3">
                  <img src={p.images[0]} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 text-sm truncate">{p.name}</h4>
                    <p className="text-xs text-stone-500">By {p.farmerName} • ₹{p.pricePerKg}/kg</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Stock: {p.availableQtyKg} kg</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProductAdmin(p.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl self-center"
                    title="Remove listing"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM TRANSACTIONS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900">
              {language === 'te' ? 'ప్లాట్‌ఫారమ్‌లోని అన్ని ఆర్డర్లు' : 'Platform Transactions & Deliveries'}
            </h3>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">Order #{ord.orderNumber}</span>
                    <span className="text-stone-500">
                      Customer: <strong>{ord.customerName}</strong> → Farmer: <strong>{ord.farmerName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-stone-900 text-sm">₹{ord.finalAmount}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold uppercase text-[10px]">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FARMER PROFILE DETAIL MODAL */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-stone-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base sm:text-lg">Farmer Full Registration Profile</h3>
              </div>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <img
                  src={selectedFarmer.avatarUrl || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=200'}
                  alt={selectedFarmer.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shrink-0"
                />
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">{selectedFarmer.fullName}</h4>
                  <p className="text-xs text-stone-500">{selectedFarmer.email}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">Mobile: {selectedFarmer.mobile}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Village & City</span>
                  <span className="font-bold text-stone-800 text-xs">{selectedFarmer.village || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Mandal</span>
                  <span className="font-bold text-stone-800 text-xs">{selectedFarmer.mandal || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">District</span>
                  <span className="font-bold text-stone-800 text-xs">{selectedFarmer.district || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">State & PIN</span>
                  <span className="font-bold text-stone-800 text-xs">{selectedFarmer.state} ({selectedFarmer.pincode})</span>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Farming Experience</span>
                  <span className="font-bold text-stone-900">{selectedFarmer.farmingExperience || 10} Years</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Farm Crops / Profile Bio</span>
                  <p className="text-stone-700 text-xs font-medium italic">
                    "{selectedFarmer.bio || 'Cultivating paddy, chilli, and seasonal vegetables with drip irrigation.'}"
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Registration Timestamp</span>
                  <span className="text-stone-600 font-semibold">{new Date(selectedFarmer.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Audit Section */}
              <div className="p-4 rounded-2xl border space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Verification Status</span>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-wider">
                    {selectedFarmer.verificationStatus || (selectedFarmer.isVerified ? 'verified' : 'pending')}
                  </span>
                  {selectedFarmer.isVerified ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">Verified Badge Active</span>
                  ) : selectedFarmer.verificationStatus === 'rejected' ? (
                    <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-xs">Profile Rejected</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs">Pending Review</span>
                  )}
                </div>
                {selectedFarmer.rejectionReason && (
                  <div className="pt-2 border-t border-stone-200 text-xs text-rose-800 font-semibold">
                    Rejection Reason: "{selectedFarmer.rejectionReason}"
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex gap-3">
                {selectedFarmer.verificationStatus !== 'verified' && selectedFarmer.verificationStatus !== 'approved' && !selectedFarmer.isVerified && (
                  <button
                    onClick={() => handleApproveUser(selectedFarmer)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Approve & Grant Badge</span>
                  </button>
                )}
                {selectedFarmer.verificationStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      const f = selectedFarmer;
                      setSelectedFarmer(null);
                      handleOpenRejectModal(f);
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Reject Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100">
            <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-base">Reject Farmer Verification</h3>
              </div>
              <button
                onClick={() => setRejectModalFarmer(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-stone-700 font-medium">
                Rejecting verification for <strong>{rejectModalFarmer.fullName}</strong> ({rejectModalFarmer.village}). Please select or enter the specific rejection reason below:
              </p>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Quick Reason Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRejectionReasonInput('Land Pattadar passbook document is missing or unreadable.')}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold"
                  >
                    Land Passbook Missing
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectionReasonInput('Mobile phone number or contact address could not be verified.')}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold"
                  >
                    Mobile/Address Unverified
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectionReasonInput('Duplicate farmer account profile detected.')}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-semibold"
                  >
                    Duplicate Profile
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Detailed Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Explain why verification was rejected so farmer can correct details..."
                  className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalFarmer(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl transition-colors shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
