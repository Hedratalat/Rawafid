import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { addToCart } from "../../utils/cart";
import AddToCartButton from "../AddToCartButton/AddToCartButton";

const INITIAL_VISIBLE = 6;

function NewArrivalCard({ product, onOpen, onAddToCart }) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`group cursor-pointer bg-white border border-secondary/20 rounded-xl overflow-hidden flex gap-4 p-3 transition-shadow hover:shadow-md ${
        visible ? "arrival-fade-up" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="relative w-28 min-h-[7rem] self-stretch shrink-0 rounded-lg bg-secondary/10 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.05]"
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 py-1">
        <span className="text-xs font-bold text-secondary">
          {product.category}
        </span>
        <h3 className="font-heading text-lg font-bold text-darkText leading-snug truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-darkText/60 leading-6 line-clamp-2 mt-0.5">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-2">
          {product.newPrice ? (
            <>
              <span className="text-xl font-bold text-primary">
                {product.newPrice} ج.م
              </span>
              <span className="text-base text-darkText/35 line-through">
                {product.oldPrice} ج.م
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-primary">
              {product.oldPrice} ج.م
            </span>
          )}
        </div>

        <AddToCartButton
          item={product}
          type="product"
          onAdd={onAddToCart}
          className="mt-3 h-11 w-full"
        />
      </div>
    </div>
  );
}

export default function NewArrivle() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [toast, setToast] = useState(null);
  const visibleCount = INITIAL_VISIBLE;
  const [headingInView, setHeadingInView] = useState(false);
  const [headingNode, setHeadingNode] = useState(null);

  useEffect(() => {
    if (!headingNode) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeadingInView(true);
          observer.unobserve(headingNode);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -120px 0px" },
    );
    observer.observe(headingNode);
    return () => observer.disconnect();
  }, [headingNode]);

  // جلب المنتجات من Products وفلترة اللي isNewArrival بس
  useEffect(() => {
    const q = query(collection(db, "Products"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(all.filter((p) => p.isNewArrival));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function openProduct(product) {
    setSelectedProduct(product);
    setActiveImage(0);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setActiveImage(0);
  }

  function handleAddToCart(product, e) {
    e?.stopPropagation();
    addToCart(product, "product");
    setToast(`تمت إضافة "${product.name}" إلى السلة`);
  }

  if (loading || products.length === 0) return null;

  const gallery = selectedProduct
    ? [
        selectedProduct.image,
        ...(Array.isArray(selectedProduct.images)
          ? selectedProduct.images
          : []),
      ].filter(Boolean)
    : [];

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <section dir="rtl" className="bg-customBg pt-0 pb-14 md:pb-16">
      <style>{`
        @keyframes arrivalPopIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes arrivalToastIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes arrivalFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes arrivalHeadingReveal {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .arrival-pop-in { animation: arrivalPopIn 0.28s ease-out both; }
        .arrival-toast-in { animation: arrivalToastIn 0.3s ease-out both; }
        .arrival-fade-up { animation: arrivalFadeUp 0.5s ease-out both; }
        .arrival-heading-reveal { animation: arrivalHeadingReveal 1.1s ease both; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={setHeadingNode}
          className={`mb-8 md:mb-10 text-center ${
            headingInView ? "arrival-heading-reveal" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
            وصل حديثًا
          </h2>
          <p className="mt-2 text-base text-darkText/60 max-w-md mx-auto">
            أحدث المنتجات اللي وصلتنا، دوس على الكارت لتعرف تفاصيله كاملة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product) => (
            <NewArrivalCard
              key={product.id}
              product={product}
              onOpen={() => openProduct(product)}
              onAddToCart={(e) => handleAddToCart(product, e)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <Link
              to="/products"
              className="h-11 px-8 rounded-full border border-secondary/50 text-darkText font-medium text-sm flex items-center hover:bg-secondary/10 transition"
            >
              عرض المزيد
            </Link>
          </div>
        )}
      </div>

      {/* Toast */}
      <div className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none px-4">
        {toast && (
          <div className="arrival-toast-in pointer-events-auto bg-accent text-darkText px-5 py-3 rounded-full shadow-lg text-sm font-bold max-w-[90vw]">
            {toast}
          </div>
        )}
      </div>

      {/* Popup تفاصيل المنتج */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
          onClick={closeProduct}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="arrival-pop-in bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative grid grid-cols-1 md:grid-cols-2"
          >
            <button
              onClick={closeProduct}
              aria-label="إغلاق"
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-darkText hover:bg-white transition"
            >
              <X size={18} />
            </button>

            {/* المعرض */}
            <div className="flex flex-col">
              <div className="relative aspect-square bg-secondary/10">
                <img
                  src={gallery[activeImage]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain p-8"
                />

                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImage(
                          (prev) =>
                            (prev - 1 + gallery.length) % gallery.length,
                        )
                      }
                      aria-label="الصورة السابقة"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-darkText hover:bg-white transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImage((prev) => (prev + 1) % gallery.length)
                      }
                      aria-label="الصورة التالية"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-darkText hover:bg-white transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                        i === activeImage
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* المحتوى */}
            <div className="p-5 md:p-6 flex flex-col gap-3 justify-center">
              <span className="text-xs font-bold text-secondary">
                {selectedProduct.category}
              </span>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-darkText">
                {selectedProduct.name}
              </h3>

              <p className="text-sm leading-6 text-darkText/70">
                {selectedProduct.description}
              </p>

              <div className="flex items-baseline gap-2">
                {selectedProduct.newPrice ? (
                  <>
                    <span className="text-2xl font-bold text-primary">
                      {selectedProduct.newPrice} ج.م
                    </span>
                    <span className="text-base text-darkText/35 line-through">
                      {selectedProduct.oldPrice} ج.م
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {selectedProduct.oldPrice} ج.م
                  </span>
                )}
              </div>

              <AddToCartButton
                item={selectedProduct}
                type="product"
                onAdd={(e) => handleAddToCart(selectedProduct, e)}
                className="mt-1 h-12"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
