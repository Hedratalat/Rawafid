import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCard from "../components/ProductCard/ProductCard";
import ProductModal from "../components/ProductModal/ProductModal";
import { useCatalog, OFFERS_KEY, catKey } from "../hooks/useCatalog";
import { addToCart } from "../utils/cart";

const PAGE_SIZE = 12;
const CATEGORY_SUBTITLES = {
  [catKey("عسل")]: "كل منتجات العسل في مكان واحد",
};

function niceStep(raw) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

// اختيارات السعر بتتبني من الأسعار الفعلية، ومفيش اختيار فاضي بيظهر
function buildPriceRanges(prices) {
  const valid = prices.filter((p) => p > 0);
  if (valid.length < 2) return [];
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return [];

  const step = niceStep((max - min) / 3);
  const start = Math.floor(min / step) * step;
  const ranges = [];
  for (let from = start; from <= max; from += step) {
    const to = from + step;
    if (valid.some((p) => p >= from && p < to)) ranges.push({ from, to });
  }
  if (ranges.length < 2) return [];

  return ranges.map((r, i) => {
    const value = (to) => `${r.from}-${to ?? ""}`;
    if (i === ranges.length - 1) {
      return {
        value: value(null),
        label: `${r.from} ج.م فأكثر`,
      };
    }
    if (i === 0) {
      return { value: value(r.to), label: `أقل من ${r.to} ج.م` };
    }
    return { value: value(r.to), label: `${r.from} - ${r.to} ج.م` };
  });
}

// أرقام الصفحات: لو 5 أو أقل تظهر كلها، غير كده بتتقصّ بـ "…"
function getPageList(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("dots");
    out.push(p);
  });
  return out;
}

function chipClass(active) {
  return `shrink-0 h-10 px-5 rounded-full border text-sm font-medium transition ${
    active
      ? "bg-primary text-customBg border-primary"
      : "bg-white text-darkText border-secondary/40 hover:bg-secondary/10"
  }`;
}

export default function Products() {
  const { items, loading } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef(null);

  const category = catKey(params.get("category") || "") || "all";
  const priceParam = params.get("price") || "";
  const search = (params.get("search") || "").trim();
  const searching = search !== "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const hasFilters = category !== "all" || priceParam !== "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function updateParams(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setParams(next, { replace: true });
  }

  function selectCategory(key) {
    // تغيير التصنيف بيمسح فلتر السعر والصفحة لأن الاختيارات بتتغير
    updateParams({ category: key === "all" ? "" : key, price: "", page: "" });
  }

  function selectPrice(value) {
    updateParams({ price: value, page: "" });
  }

  function goToPage(n) {
    updateParams({ page: n === 1 ? "" : String(n) });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    setParams(next, { replace: true });
  }

  function clearSearch() {
    updateParams({ search: "", page: "" });
  }

  function handleAddToCart(item, e) {
    e?.stopPropagation();
    addToCart(item, item.type);
    setToast(`تمت إضافة "${item.name}" إلى السلة`);
  }

  const matched = useMemo(() => {
    const words = catKey(search).split(" ").filter(Boolean);
    if (words.length === 0) return items;
    return items.filter((i) => {
      const hay = catKey(`${i.name} ${i.description} ${i.categoryLabel}`);
      return words.every((w) => hay.includes(w));
    });
  }, [items, search]);

  // التصنيفات: الكل + العروض + تصنيفات المنتجات (من النتايج بس)
  const categories = useMemo(() => {
    const list = [{ key: "all", label: "الكل" }];
    if (matched.some((i) => i.type === "offer")) {
      list.push({ key: OFFERS_KEY, label: "العروض" });
    }
    const seen = new Set();
    matched.forEach((i) => {
      if (i.type === "product" && i.category && !seen.has(i.category)) {
        seen.add(i.category);
        list.push({ key: i.category, label: i.categoryLabel });
      }
    });
    return list;
  }, [matched]);

  // "الكل" = المنتجات بس، إلا لو فيه بحث بيشمل العروض كمان
  const scoped = useMemo(
    () =>
      matched.filter((i) =>
        category === "all"
          ? searching || i.type === "product"
          : i.category === category,
      ),
    [matched, category, searching],
  );

  const priceRanges = useMemo(
    () => buildPriceRanges(scoped.map((i) => i.price)),
    [scoped],
  );

  const [pFrom, pTo] = priceParam.split("-");
  const filtered = scoped.filter((i) => {
    if (!priceParam) return true;
    if (i.price < Number(pFrom || 0)) return false;
    if (pTo && i.price >= Number(pTo)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const title =
    category === "all"
      ? "منتجاتنا"
      : category === OFFERS_KEY
        ? "العروض"
        : categories.find((c) => c.key === category)?.label ||
          params.get("category");

  const subtitle =
    category === "all"
      ? "كل منتجاتنا الطبيعية في مكان واحد، اختار اللي يناسبك"
      : category === OFFERS_KEY
        ? "عروض مختارة بعناية بأسعار مميزة"
        : CATEGORY_SUBTITLES[category] || `كل منتجات ${title} في مكان واحد`;
  const pageTitle = searching ? `نتائج البحث عن "${search}"` : title;
  const pageSubtitle = searching
    ? loading
      ? "جاري البحث..."
      : `${filtered.length} نتايج مطابقة لبحثك عن "${search}"`
    : subtitle;
  const arrowClass =
    "w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-secondary/40 flex items-center justify-center text-primary hover:bg-secondary/10 transition disabled:opacity-40 disabled:pointer-events-none";

  return (
    <>
      <Navbar />

      <main dir="rtl" className="bg-customBg min-h-[70vh] py-10 md:py-14">
        <style>{`
          @keyframes productsFadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes productsToastIn {
            from { opacity: 0; transform: translateY(-14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .products-fade-up { animation: productsFadeUp 0.5s ease-out backwards; }
          .products-toast-in { animation: productsToastIn 0.3s ease-out both; }
        `}</style>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* العنوان */}
          <div className="mb-8 md:mb-10 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary break-words">
              {pageTitle}
            </h2>
            <p className="mt-2 text-base text-darkText/60 max-w-md mx-auto">
              {pageSubtitle}
            </p>
          </div>

          {/* الفلاتر */}
          <div className="bg-white border border-secondary/20 rounded-2xl p-4 mb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => selectCategory(c.key)}
                    className={chipClass(category === c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {priceRanges.length > 0 && (
                <button
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-label="فلتر السعر"
                  className="relative md:hidden shrink-0 w-10 h-10 rounded-full border border-secondary/40 flex items-center justify-center text-primary"
                >
                  <SlidersHorizontal size={18} />
                  {priceParam !== "" && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-accent" />
                  )}
                </button>
              )}
            </div>

            {priceRanges.length > 0 && (
              <div
                className={`${
                  filtersOpen ? "flex" : "hidden"
                } md:flex items-center gap-3 border-t border-secondary/20 pt-4`}
              >
                <span className="shrink-0 text-sm font-bold text-darkText">
                  السعر
                </span>
                <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => selectPrice("")}
                    className={chipClass(priceParam === "")}
                  >
                    أي سعر
                  </button>
                  {priceRanges.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => selectPrice(r.value)}
                      className={chipClass(priceParam === r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            ref={resultsRef}
            className="scroll-mt-24 flex items-center justify-between gap-4 mb-4 min-h-[20px]"
          >
            {!loading && (
              <>
                {searching && (
                  <button
                    onClick={clearSearch}
                    className="text-sm font-medium text-primary hover:opacity-80 transition"
                  >
                    مسح البحث
                  </button>
                )}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-darkText/50 hover:text-red-600 transition-colors"
                  >
                    مسح الفلتر
                  </button>
                )}
              </>
            )}
          </div>

          {/* النتائج */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-3xl bg-secondary/10 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-base text-darkText/70">
                {searching
                  ? hasFilters
                    ? "مفيش نتايج بالفلتر ده"
                    : `مفيش نتايج عن "${search}"`
                  : "مفيش منتجات تطابق الفلاتر دي"}
              </p>
              <button
                onClick={searching && !hasFilters ? clearSearch : clearFilters}
                className="h-11 px-8 rounded-full bg-primary text-customBg font-bold text-sm hover:opacity-90 transition"
              >
                {searching && !hasFilters ? "مسح البحث" : "مسح الفلتر"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleItems.map((item, index) => (
                <ProductCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  index={index}
                  onOpen={() => setSelected(item)}
                  onAddToCart={(e) => handleAddToCart(item, e)}
                />
              ))}
            </div>
          )}

          {/* ترقيم الصفحات */}
          {!loading && totalPages > 1 && (
            <nav
              aria-label="الصفحات"
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-10"
            >
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="الصفحة السابقة"
                className={arrowClass}
              >
                <ChevronRight size={18} />
              </button>

              {getPageList(currentPage, totalPages).map((p, i) =>
                p === "dots" ? (
                  <span
                    key={`dots-${i}`}
                    className="w-6 text-center text-darkText/40"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-label={`صفحة ${p}`}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border text-sm font-bold transition ${
                      p === currentPage
                        ? "bg-primary text-customBg border-primary"
                        : "bg-white text-darkText border-secondary/40 hover:bg-secondary/10"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="الصفحة التالية"
                className={arrowClass}
              >
                <ChevronLeft size={18} />
              </button>
            </nav>
          )}
        </div>

        {/* Toast */}
        <div className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none px-4">
          {toast && (
            <div className="products-toast-in pointer-events-auto bg-accent text-darkText px-5 py-3 rounded-full shadow-lg text-sm font-bold max-w-[90vw]">
              {toast}
            </div>
          )}
        </div>

        {selected && (
          <ProductModal
            item={selected}
            onClose={() => setSelected(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      <Footer />
    </>
  );
}
