// services/cartService.ts —— 购物车
import { apiFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api/cart`;

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sellerId: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
  product: CartProduct | null;
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
  totalCount: number;
}

export async function getCart(): Promise<CartResponse> {
  return apiFetch(BASE_URL);
}

export async function getCartCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>(`${BASE_URL}/count`, { silent: true });
  return r.count;
}

export async function addToCart(productId: string, quantity = 1): Promise<{ count: number }> {
  return apiFetch(BASE_URL, { method: 'POST', body: { productId, quantity } });
}

export async function setCartQuantity(productId: string, quantity: number): Promise<void> {
  await apiFetch(`${BASE_URL}/${productId}`, { method: 'PATCH', body: { quantity }, silent: true });
}

export async function removeFromCart(productId: string): Promise<void> {
  await apiFetch(`${BASE_URL}/${productId}`, { method: 'DELETE' });
}
