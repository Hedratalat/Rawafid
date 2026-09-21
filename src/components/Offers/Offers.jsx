import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { addToCart } from "../../utils/cart";
import AddToCartButton from "../AddToCartButton/AddToCartButton";

const INITIAL_VISIBLE = 6;

function OfferCard({ offer, onOpen, onAddToCart }) {
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
      className={`group cursor-pointer bg-white border border-secondary/20 rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
        visible ? "offer-fade-up" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="relative aspect-square bg-secondary/10">
        {offer.badge && (
          <span className="absolute top-3 right-3 z-10 bg-accent text-customBg text-xs font-bold px-3 py-1 rounded-full">
            {offer.badge}
          </span>
        )}
        <img
          src={offer.image}
          alt={offer.title}
          className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-heading text-lg font-bold text-darkText leading-snug">
          {offer.title}
        </h3>

        {offer.description && (
          <p className="text-sm text-darkText/60 leading-6 line-clamp-2">
            {offer.description}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto">
          {offer.newPrice ? (
            <>
              <span className="text-xl font-bold text-primary">
                {offer.newPrice} ج.م
              </span>
              <span className="text-base text-darkText/35 line-through">
                {offer.oldPrice} ج.م
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-primary">
              {offer.oldPrice} ج.م
            </span>
          )}
        </div>

        <AddToCartButton
          item={offer}
          type="offer"
          onAdd={onAddToCart}
          className="mt-2 h-11"
        />
      </div>
    </div>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [toast, setToast] = useState(null);
  const visibleCount = INITIAL_VISIBLE;
  const [headingInView, setHeadingInView] = useState(false);
  const [headingNode, setHeadingNode] = useState(null);

  // observer مستقل للعنوان بس، بيشتغل قبل ما توصله فعليًا (rootMargin سالب)
  // عشان يبان "بيتكشف" بهدوء مش بيلمع بسرعة
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

  // جلب العروض من كولكشن OffersSection فقط، مرتبة بحسب order
  useEffect(() => {
    const q = query(collection(db, "OffersSection"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function openOffer(offer) {
    setSelectedOffer(offer);
    setActiveImage(0);
  }

  function closeOffer() {
    setSelectedOffer(null);
    setActiveImage(0);
  }

  function handleAddToCart(offer, e) {
    e?.stopPropagation();
    addToCart(offer, "offer");
    setToast(`تمت إضافة "${offer.title}" إلى السلة`);
  }

  if (loading || offers.length === 0) return null;

  const gallery = selectedOffer
    ? [
        selectedOffer.image,
        ...(Array.isArray(selectedOffer.images) ? selectedOffer.images : []),
      ].filter(Boolean)
    : [];

  const visibleOffers = offers.slice(0, visibleCount);
  const hasMore = visibleCount < offers.length;

  return (
    <section dir="rtl" className="bg-customBg py-14 md:py-16">
      <style>{`
        @keyframes offerPopIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes offerToastIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes offerFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes offerHeadingReveal {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .offer-pop-in { animation: offerPopIn 0.28s ease-out both; }
        .offer-toast-in { animation: offerToastIn 0.3s ease-out both; }
        .offer-fade-up { animation: offerFadeUp 0.5s ease-out both; }
        .offer-heading-reveal { animation: offerHeadingReveal 1.1s ease both; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={setHeadingNode}
          className={`mb-8 md:mb-10 text-center ${
            headingInView ? "offer-heading-reveal" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
            عروض مختارة بعناية
          </h2>
          <p className="mt-2 text-base text-darkText/60 max-w-md mx-auto">
            كل عرض له قصته الطبيعية، دوس على الكارت لتعرف تفاصيله كاملة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onOpen={() => openOffer(offer)}
              onAddToCart={(e) => handleAddToCart(offer, e)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <Link
              to="/products?category=offers"
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
          <div className="offer-toast-in pointer-events-auto bg-accent text-darkText px-5 py-3 rounded-full shadow-lg text-sm font-bold max-w-[90vw]">
            {toast}
          </div>
        )}
      </div>

      {/* Popup تفاصيل العرض */}
      {selectedOffer && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
          onClick={closeOffer}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="offer-pop-in bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative grid grid-cols-1 md:grid-cols-2"
          >
            <button
              onClick={closeOffer}
              aria-label="إغلاق"
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-darkText hover:bg-white transition"
            >
              <X size={18} />
            </button>

            {/* المعرض */}
            <div className="flex flex-col">
              <div className="relative aspect-square bg-secondary/10">
                {selectedOffer.badge && (
                  <span className="absolute top-4 right-4 z-10 bg-accent text-customBg text-xs font-bold px-3 py-1 rounded-full">
                    {selectedOffer.badge}
                  </span>
                )}
                <img
                  src={gallery[activeImage]}
                  alt={selectedOffer.title}
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
              <h3 className="font-heading text-xl md:text-2xl font-bold text-darkText">
                {selectedOffer.title}
              </h3>

              <p className="text-sm leading-6 text-darkText/70">
                {selectedOffer.description}
              </p>

              <div className="flex items-baseline gap-2">
                {selectedOffer.newPrice ? (
                  <>
                    <span className="text-2xl font-bold text-primary">
                      {selectedOffer.newPrice} ج.م
                    </span>
                    <span className="text-base text-darkText/35 line-through">
                      {selectedOffer.oldPrice} ج.م
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {selectedOffer.oldPrice} ج.م
                  </span>
                )}
              </div>

              <AddToCartButton
                item={selectedOffer}
                type="offer"
                onAdd={(e) => handleAddToCart(selectedOffer, e)}
                className="mt-1 h-12"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
