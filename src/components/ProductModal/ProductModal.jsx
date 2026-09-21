import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import AddToCartButton from "../AddToCartButton/AddToCartButton";

export default function ProductModal({ item, onClose, onAddToCart }) {
  const [activeImage, setActiveImage] = useState(0);
  const gallery = [item.image, ...item.images].filter(Boolean);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <style>{`
        @keyframes productModalPopIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .product-modal-pop-in { animation: productModalPopIn 0.28s ease-out both; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="product-modal-pop-in bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative grid grid-cols-1 md:grid-cols-2"
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-darkText hover:bg-white transition"
        >
          <X size={18} />
        </button>

        {/* المعرض */}
        <div className="flex flex-col">
          <div className="relative aspect-square bg-secondary/10">
            {item.badge && (
              <span className="absolute top-4 right-4 z-10 bg-accent text-customBg text-xs font-bold px-3 py-1 rounded-full">
                {item.badge}
              </span>
            )}
            <img
              src={gallery[activeImage]}
              alt={item.name}
              className="w-full h-full object-contain p-8"
            />

            {gallery.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImage(
                      (prev) => (prev - 1 + gallery.length) % gallery.length,
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
                    i === activeImage ? "border-primary" : "border-transparent"
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
          {item.categoryLabel && (
            <span className="text-xs font-bold text-secondary">
              {item.categoryLabel}
            </span>
          )}
          <h3 className="font-heading text-xl md:text-2xl font-bold text-darkText">
            {item.name}
          </h3>

          <p className="text-sm leading-6 text-darkText/70">
            {item.description}
          </p>

          <div className="flex items-baseline gap-2">
            {item.newPrice ? (
              <>
                <span className="text-2xl font-bold text-primary">
                  {item.newPrice} ج.م
                </span>
                <span className="text-base text-darkText/35 line-through">
                  {item.oldPrice} ج.م
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">
                {item.oldPrice} ج.م
              </span>
            )}
          </div>

          <AddToCartButton
            item={item}
            type={item.type}
            onAdd={(e) => onAddToCart(item, e)}
            className="mt-1 h-12"
          />
        </div>
      </div>
    </div>
  );
}
