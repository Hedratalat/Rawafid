const CART_STORAGE_KEY = "cartRawafid";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

// type: "product" (من Products) أو "offer" (من OffersSection)
export function addToCart(item, type = "product") {
  const cart = getCart();
  const index = cart.findIndex((i) => i.id === item.id && i.type === type);

  if (index !== -1) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      id: item.id,
      type,
      name: item.name || item.title,
      image: item.image,
      price: Number(item.newPrice || item.oldPrice),
      quantity: 1,
    });
  }

  saveCart(cart);
}

export function changeQty(id, type, delta) {
  const cart = getCart()
    .map((i) =>
      i.id === id && i.type === type
        ? { ...i, quantity: i.quantity + delta }
        : i,
    )
    .filter((i) => i.quantity > 0);
  saveCart(cart);
}

export function removeItem(id, type) {
  saveCart(getCart().filter((i) => !(i.id === id && i.type === type)));
}

export function clearCart() {
  saveCart([]);
}
