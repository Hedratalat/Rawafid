import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../../hooks/useCart";

export default function AddToCartButton({
  item,
  type = "product",
  onAdd,
  iconOnly = false,
  className = "",
}) {
  const { getQty, removeItem } = useCart();
  const added = getQty(item.id, type) > 0;
  const iconSize = iconOnly ? 18 : 16;

  function handleClick(e) {
    e.stopPropagation();
    if (added) {
      removeItem(item.id, type);
      return;
    }
    onAdd(e);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={added ? "إزالة من السلة" : "أضف للسلة"}
      className={`flex items-center justify-center gap-2 rounded-full font-bold text-sm text-customBg transition-all duration-300 hover:opacity-90 active:scale-95 ${
        added ? "bg-primary" : "bg-accent"
      } ${iconOnly ? "w-10 h-10 shrink-0" : ""} ${className}`}
    >
      {added ? <Trash2 size={iconSize} /> : <ShoppingCart size={iconSize} />}
      {!iconOnly && (added ? "إزالة من السلة" : "أضف للسلة")}
    </button>
  );
}
