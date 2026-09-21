import { useState, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
const NAV_LINKS = [
  { label: "الرئيسية", href: "/" },
  { label: "منتجاتنا", href: "/products" },
  { label: "العروض", href: "/products?category=offers" },
  { label: "العسل", href: "/products?category=عسل" },
  { label: "تواصل معنا", href: "/#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlSearch = params.get("search") || "";
  const [searchText, setSearchText] = useState(urlSearch);

  useEffect(() => {
    setSearchText(urlSearch);
  }, [urlSearch]);

  function handleSearch(e) {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;
    navigate(`/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }
  const { cart, totalCount, totalPrice, changeQty, removeItem, clearCart } =
    useCart();

  //الاسكرول يقف لما السلة مفتوحة
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  function handleCheckout() {
    navigate("/checkout");
    setCartOpen(false);
  }
  return (
    <>
      <header className="sticky top-0 z-[55] bg-primary border-b border-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[68px] sm:h-[72px]">
            {/* اللوجو + اللينكات */}
            <div className="flex items-center gap-8">
              <Link
                to="/"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="md:hidden flex items-center shrink-0"
              >
                <img
                  src="/logo.png"
                  alt="روافد"
                  className="h-9 w-auto brightness-0 invert"
                />
              </Link>

              <nav className="hidden md:flex items-center gap-7">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-lg font-medium text-customBg hover:opacity-95 transition-opacity"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* البحث + السلة + المنيو */}
            <div className="flex items-center  ">
              <button
                onClick={() => setSearchOpen((s) => !s)}
                aria-label="بحث"
                className="flex items-center justify-center w-10 h-10 rounded-full text-customBg hover:opacity-95"
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                aria-label="السلة"
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-customBg hover:opacity-95"
              >
                <ShoppingBag size={22} />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-[20px] h-[20px] px-1 rounded-full text-xs font-bold flex items-center justify-center bg-accent text-primary">
                    {totalCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="القائمة"
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full text-customBg"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {searchOpen && (
            <form onSubmit={handleSearch} className="pb-3">
              <div className="flex items-center rounded-full px-3 bg-white border border-secondary/60">
                <button
                  type="submit"
                  aria-label="بحث"
                  className="shrink-0 text-primary"
                >
                  <Search size={18} />
                </button>
                <input
                  autoFocus
                  type="text"
                  enterKeyHint="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ابحث عن منتج أو عرض..."
                  className="w-full h-11 px-2 text-base bg-transparent outline-none text-right text-darkText"
                />
              </div>
            </form>
          )}
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-secondary/30 px-4 py-3 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-lg font-medium text-customBg py-1.5"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* خلفية السلة */}
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* السلة */}
      <aside
        dir="rtl"
        className={`fixed top-0 left-0 h-full w-[88vw] max-w-sm bg-customBg z-[70] shadow-2xl flex flex-col transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-primary">
          <span className="font-heading font-bold text-xl text-customBg">
            سلة المشتريات ({totalCount})
          </span>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="إغلاق"
            className="text-customBg"
          >
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
              <ShoppingBag size={30} className="text-secondary" />
            </span>
            <p className="text-base text-darkText/70">
              السلة فارغة، تصفح المنتجات وأضف ما يعجبك
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {cart.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex gap-3 p-3 bg-white rounded-2xl border border-secondary/20"
                >
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-secondary/10 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.type === "offer" && (
                          <span className="inline-block text-xs font-bold bg-accent text-customBg px-2 py-0.5 rounded-full">
                            عرض
                          </span>
                        )}
                        <p className="text-base font-bold text-darkText truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-secondary mt-0.5">
                          {item.price} ج.م
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        aria-label="حذف"
                        className="shrink-0 text-darkText/40 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 rounded-full bg-secondary/15 p-0.5">
                        <button
                          onClick={() => changeQty(item.id, item.type, -1)}
                          aria-label="تقليل"
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-primary shadow-sm active:scale-90 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-base font-bold w-6 text-center text-darkText">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => changeQty(item.id, item.type, 1)}
                          aria-label="زيادة"
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-primary shadow-sm active:scale-90 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-base font-bold text-primary">
                        {item.price * item.quantity} ج.م
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-5 py-4 border-t border-secondary/30 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-darkText">
                  الإجمالي
                </span>
                <span className="text-2xl font-bold text-primary">
                  {totalPrice} ج.م
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full h-12 rounded-full font-bold text-base bg-primary text-customBg hover:opacity-90 active:scale-[0.98] transition"
              >
                إتمام الشراء
              </button>
              <button
                onClick={clearCart}
                className="w-full mt-2 py-1 text-sm text-darkText/50 hover:text-red-600 transition-colors"
              >
                إفراغ السلة
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
