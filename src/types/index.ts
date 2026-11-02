export type UserRole = 'farmer' | 'customer' | 'admin';

export type Language = 'en' | 'te';

export interface UserProfile {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  avatarUrl: string;
  role: UserRole;
  farmingExperience?: number; // years
  bio?: string;
  isVerified?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  createdAt: string;
}

export type ProductCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'pulses'
  | 'spices'
  | 'dairy'
  | 'organic'
  | 'other';

export interface CategoryInfo {
  id: ProductCategory;
  nameEn: string;
  nameTe: string;
  iconName: string;
  descriptionEn: string;
  descriptionTe: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerVillage: string;
  farmerMandal: string;
  farmerDistrict: string;
  farmerState: string;
  farmerVerified: boolean;
  farmerPhone: string;
  name: string;
  teluguName: string;
  category: ProductCategory;
  description: string;
  descriptionTe?: string;
  pricePerKg: number;
  availableQtyKg: number;
  unit: string; // 'kg', 'quintal', 'bunch', 'litre'
  harvestDate: string;
  location: string;
  isOrganic: boolean;
  deliveryOptions: 'pickup' | 'delivery' | 'both';
  images: string[];
  status: 'available' | 'low_stock' | 'out_of_stock';
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'upi' | 'card' | 'cod' | 'razorpay';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface OrderItem {
  productId: string;
  productName: string;
  productTeluguName: string;
  pricePerKg: number;
  quantityKg: number;
  subtotal: number;
  image: string;
  unit: string;
  farmerId: string;
  farmerName: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryMethod: 'pickup' | 'farmer_delivery' | 'partner';
  trackingNumber?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerVillage: string;
  createdAt: string;
  estimatedDeliveryDate: string;
  notes?: string;
  otpCode?: string;
}

export interface MarketPrice {
  id: string;
  cropName: string;
  cropTeluguName: string;
  marketName: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string; // '₹/Quintal' or '₹/kg'
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  marketDate: string;
  dataSource: string; // 'AGMARKNET' | 'e-NAM'
  lastUpdated: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  targetRole: UserRole | 'all';
  title: string;
  titleTe: string;
  message: string;
  messageTe: string;
  type: 'order' | 'payment' | 'stock' | 'system' | 'message';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  productId?: string;
  productName?: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface FarmerVerificationItem {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  district: string;
  landHoldingAcres: number;
  kisanCreditCardNo?: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  userRole: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}
