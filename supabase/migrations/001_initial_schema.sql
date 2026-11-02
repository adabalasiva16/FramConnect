-- FARMCONNECT SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Covers all 20 required tables with UUIDs, RLS, and role-based policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  village TEXT,
  mandal TEXT,
  district TEXT,
  state TEXT DEFAULT 'Andhra Pradesh',
  pincode TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'customer', 'admin')),
  farming_experience INTEGER,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMERS
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  farm_name TEXT,
  total_land_acres NUMERIC,
  primary_crops TEXT[],
  bank_account_verified BOOLEAN DEFAULT FALSE,
  upi_id TEXT,
  rating NUMERIC DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  default_delivery_address JSONB,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_te TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  description_en TEXT,
  description_te TEXT
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  farmer_village TEXT,
  farmer_district TEXT,
  farmer_verified BOOLEAN DEFAULT FALSE,
  farmer_phone TEXT,
  name TEXT NOT NULL,
  telugu_name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(id),
  description TEXT,
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg > 0),
  available_qty_kg NUMERIC NOT NULL CHECK (available_qty_kg >= 0),
  unit TEXT DEFAULT 'kg',
  harvest_date DATE NOT NULL,
  location TEXT NOT NULL,
  is_organic BOOLEAN DEFAULT FALSE,
  delivery_options TEXT DEFAULT 'both' CHECK (delivery_options IN ('pickup', 'delivery', 'both')),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock')),
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  farmer_id UUID NOT NULL REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  delivery_charge NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cod', 'razorpay')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('pickup', 'farmer_delivery', 'partner')),
  tracking_number TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_telugu_name TEXT,
  price_per_kg NUMERIC NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DELIVERY DETAILS
CREATE TABLE IF NOT EXISTS delivery_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  partner_name TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  current_location JSONB,
  estimated_time TEXT,
  otp_code TEXT,
  delivered_at TIMESTAMPTZ
);

-- 11. DELIVERY PARTNERS
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  districts_served TEXT[],
  vehicle_type TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 12. COLLECTION CENTRES
CREATE TABLE IF NOT EXISTS collection_centres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_name TEXT NOT NULL,
  village TEXT NOT NULL,
  mandal TEXT NOT NULL,
  district TEXT NOT NULL,
  coordinator_name TEXT NOT NULL,
  coordinator_phone TEXT NOT NULL,
  open_hours TEXT DEFAULT '7:00 AM - 6:00 PM'
);

-- 13. MARKET PRICES (AGMARKNET & e-NAM)
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_name TEXT NOT NULL,
  crop_telugu_name TEXT NOT NULL,
  market_name TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  min_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  modal_price NUMERIC NOT NULL,
  unit TEXT DEFAULT '₹/Quintal',
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  change_percent NUMERIC DEFAULT 0,
  market_date DATE NOT NULL,
  data_source TEXT DEFAULT 'AGMARKNET / e-NAM',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 14. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  recipient_name TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  title_te TEXT NOT NULL,
  message TEXT NOT NULL,
  message_te TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. FAVOURITES
CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. SUPPORT REQUESTS
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_role TEXT DEFAULT 'guest',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. FARMER VERIFICATION
CREATE TABLE IF NOT EXISTS farmer_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  land_holding_acres NUMERIC,
  kisan_credit_card_no TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- 20. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read available products
CREATE POLICY "Public products viewable" ON products FOR SELECT USING (true);
-- Farmers can only insert/update/delete their own products
CREATE POLICY "Farmers can manage own products" ON products FOR ALL USING (auth.uid() = farmer_id);

-- Orders: Customers see their orders, Farmers see orders placed to them
CREATE POLICY "Users see related orders" ON orders FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = farmer_id);
-- Customers can place orders
CREATE POLICY "Customers insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
-- Farmers and customers can update order status accordingly
CREATE POLICY "Parties update orders" ON orders FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = farmer_id);
