import { useState, useEffect } from "react";
import AddToCartButton from "../AddToCartButton/AddToCartButton";

export default function ProductCard({ item, index = 0, onOpen, onAddToCart }) {
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

  const oldPrice = Number(item.oldPrice);
  const newPrice = Number(item.newPrice);
  const discount =
    newPrice > 0 && oldPrice > newPrice
      ? Math.round((1 - newPrice / oldPrice) * 100)
      : 0;
  const badge = item.badge || (discount > 0 ? `خصم ${discount}%` : "");

  return (
    <div
      ref={setNode}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={visible ? { animationDelay: `${(index % 3) * 90}ms` } : undefined}
      className={`group cursor-pointer bg-white border border-secondary/20 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-secondary/40 ${
        visible ? "products-fade-up" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/15 via-accent/10 to-primary/5">
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-accent/20 blur-2xl" />
        {badge && (
          <span className="absolute top-3 right-3 z-10 bg-accent text-customBg text-xs font-bold px-3 py-1 rounded-full shadow">
            {badge}
          </span>
        )}
        <img
          src={item.image}
          alt={item.name}
          className="relative w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
        />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {item.categoryLabel && (
          <span className="self-start text-xs font-bold text-secondary bg-secondary/15 px-2.5 py-0.5 rounded-full">
            {item.categoryLabel}
          </span>
        )}
        <h3 className="font-heading text-lg font-bold text-darkText leading-snug truncate">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-darkText/60 leading-6 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto pt-1">
          {item.newPrice ? (
            <>
              <span className="text-xl font-bold text-primary">
                {item.newPrice} ج.م
              </span>
              <span className="text-base text-darkText/35 line-through">
                {item.oldPrice} ج.م
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-primary">
              {item.oldPrice} ج.م
            </span>
          )}
        </div>

        <AddToCartButton
          item={item}
          type={item.type}
          onAdd={onAddToCart}
          className="mt-2 h-11"
        />
      </div>
    </div>
  );
}
