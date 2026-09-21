import { useState, useEffect } from "react";
import {
  getCart,
  addToCart,
  changeQty,
  removeItem,
  clearCart,
} from "../utils/cart";

export function useCart() {
  const [cart, setCart] = useState(getCart);

  useEffect(() => {
    const sync = () => setCart(getCart());
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const getQty = (id, type) =>
    cart.find((i) => i.id === id && i.type === type)?.quantity || 0;

  return {
    cart,
    totalCount,
    totalPrice,
    getQty,
    addToCart,
    changeQty,
    removeItem,
    clearCart,
  };
}
