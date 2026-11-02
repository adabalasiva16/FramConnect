import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem, Product } from '../types';

interface CartContextType {
  items: OrderItem[];
  addToCart: (product: Product, quantityKg?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantityKg: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalAmount: number;
  deliveryCharge: number;
  finalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('farmconnect_cart_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('farmconnect_cart_v1', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantityKg: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        const newQty = next[existingIndex].quantityKg + quantityKg;
        // Cap at available stock
        const validQty = Math.min(newQty, product.availableQtyKg);
        next[existingIndex] = {
          ...next[existingIndex],
          quantityKg: validQty,
          subtotal: validQty * next[existingIndex].pricePerKg,
        };
        return next;
      } else {
        const validQty = Math.min(quantityKg, product.availableQtyKg);
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          productTeluguName: product.teluguName,
          pricePerKg: product.pricePerKg,
          quantityKg: validQty,
          subtotal: validQty * product.pricePerKg,
          image: product.images[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
          unit: product.unit || 'kg',
          farmerId: product.farmerId,
          farmerName: product.farmerName,
        };
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantityKg: number) => {
    if (quantityKg <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          return {
            ...i,
            quantityKg,
            subtotal: quantityKg * i.pricePerKg,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = totalAmount >= 500 || totalAmount === 0 ? 0 : 40;
  const finalAmount = totalAmount + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        totalAmount,
        deliveryCharge,
        finalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
