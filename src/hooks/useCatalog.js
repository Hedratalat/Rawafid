import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export const OFFERS_KEY = "offers";

// مفتاح موحّد للتصنيف: بيتجاهل المسافات الزيادة والحروف المخفية والتشكيل واختلاف الهمزات
export function catKey(value = "") {
  return String(value)
    .normalize("NFKC")
    .replace(/[\u064B-\u0652\u0640\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanLabel(value = "") {
  return String(value)
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(raw, type) {
  const isOffer = type === "offer";
  return {
    id: raw.id,
    type, // "product" | "offer" (نفس النوع اللي في السلة)
    name: raw.name || raw.title || "",
    description: raw.description || "",
    image: raw.image,
    images: Array.isArray(raw.images) ? raw.images : [],
    badge: raw.badge || "",
    category: isOffer ? OFFERS_KEY : catKey(raw.category),
    categoryLabel: isOffer ? "العروض" : cleanLabel(raw.category),
    oldPrice: raw.oldPrice,
    newPrice: raw.newPrice,
    price: Number(raw.newPrice || raw.oldPrice) || 0,
  };
}

export function useCatalog() {
  const [products, setProducts] = useState(null);
  const [offers, setOffers] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "Products"), orderBy("order", "asc"));
    return onSnapshot(
      q,
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(err);
        setProducts([]);
      },
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "OffersSection"), orderBy("order", "asc"));
    return onSnapshot(
      q,
      (snap) => setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(err);
        setOffers([]);
      },
    );
  }, []);

  const items = useMemo(
    () => [
      ...(products || []).map((p) => normalize(p, "product")),
      ...(offers || []).map((o) => normalize(o, "offer")),
    ],
    [products, offers],
  );

  return { items, loading: products === null || offers === null };
}
