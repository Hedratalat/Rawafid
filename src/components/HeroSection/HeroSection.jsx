import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import { ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const AUTOPLAY_DELAY = 4000;

export default function HeroSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // جلب العروض لايف من Firebase (بترتيب الـ order، ولو ناقص يترتب بالـ createdAt)
  useEffect(() => {
    const q = query(collection(db, "HeroSection"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const orderA = typeof a.order === "number" ? a.order : Infinity;
        const orderB = typeof b.order === "number" ? b.order : Infinity;
        return orderA - orderB;
      });
      setOffers(data);
      setLoading(false);
      // لو العدد قل عن الـ activeIndex الحالي، رجّعه للأول
      setActiveIndex((prev) => (prev >= data.length ? 0 : prev));
    });
    return () => unsub();
  }, []);

  // الأوتوبلاي: بيشتغل بس لو فيه أكتر من عرض واحد
  useEffect(() => {
    if (isPaused || offers.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, AUTOPLAY_DELAY);
    return () => clearInterval(timerRef.current);
  }, [isPaused, offers.length]);

  if (loading || offers.length === 0) return null;

  return (
    <section dir="rtl" className="relative overflow-hidden bg-customBg">
      {/* أنيميشنز محلية للسكشن */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        .anim-fade-up { animation: fadeSlideUp 0.55s ease-out both; }
        .anim-fade-scale { animation: fadeScaleIn 0.6s ease-out both; }
        .anim-pop { animation: popIn 0.4s ease-out both; }
      `}</style>

      {/* خلفية زخرفية - كتل ضوء ناعمة هادية */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -right-16 w-[260px] h-[260px] rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[240px] h-[240px] rounded-full  bg-secondary/25  blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full text-primary/[0.04]"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="dots"
              width="26"
              height="26"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-8">
        {/* توقيع البراند الثابت */}
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5">
          <span className="h-px w-10 bg-accent/40" />
          <span className=" font-heading text-base font-semibold italic text-accent tracking-wide">
            رحيق الطبيعة .. في كل قطرة
          </span>
          <span className="h-px w-10 bg-accent/40" />
        </div>

        {/* مسار السلايدر */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            {offers.map((offer, index) => (
              <div
                key={offer.id}
                className="w-full shrink-0 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-5 md:gap-12 items-center"
              >
                {/* النص - يمين */}
                <div
                  key={`text-${offer.id}-${activeIndex === index}`}
                  className="order-1 flex flex-col items-start text-right"
                >
                  <span
                    className="anim-fade-up inline-flex items-center px-3.5 py-1 rounded-full bg-accent text-customBg text-sm font-bold mb-3"
                    style={{ animationDelay: "0.05s" }}
                  >
                    {offer.badge}
                  </span>

                  <h1
                    style={{ animationDelay: "0.12s" }}
                    className="anim-fade-up text-[30px] sm:text-[42px] lg:text-[48px] font-bold leading-[1.05] text-darkText"
                  >
                    {offer.title}
                  </h1>

                  <p
                    className="anim-fade-up mt-2.5 max-w-md text-[15px] leading-6 text-darkText/75"
                    style={{ animationDelay: "0.18s" }}
                  >
                    {offer.description}
                  </p>

                  <div
                    className="anim-fade-up mt-3 flex items-center gap-3"
                    style={{ animationDelay: "0.24s" }}
                  >
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      {offer.newPrice} ج.م
                    </span>
                    <span className="text-base text-darkText/40 line-through">
                      {offer.oldPrice} ج.م
                    </span>
                  </div>

                  <div
                    className="anim-fade-up mt-4 flex items-center gap-3"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <Link
                      to="/products"
                      className="flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-customBg font-bold text-[14px] transition-transform duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
                    >
                      اشتري الآن
                      <ArrowLeft size={16} />
                    </Link>
                    <Link
                      to="/products?category=offers"
                      className="inline-flex items-center h-11 px-5 rounded-full border border-secondary/50 text-darkText font-medium text-[14px] transition-transform duration-200 hover:bg-secondary/10 hover:-translate-y-0.5 active:scale-95"
                    >
                      كل العروض
                    </Link>
                  </div>

                  <div
                    className="anim-fade-up mt-4 flex items-center gap-5"
                    style={{ animationDelay: "0.36s" }}
                  >
                    <div className="flex items-center gap-1.5 text-darkText/70">
                      <Truck size={15} className="text-primary" />
                      <span className="text-[12.5px] font-medium">
                        توصيل لكل المحافظات
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-darkText/70">
                      <ShieldCheck size={15} className="text-primary" />
                      <span className="text-[12.5px] font-medium">
                        ضمان الجودة 100%
                      </span>
                    </div>
                  </div>
                </div>

                {/* الصورة الكبيرة - شمال */}
                <div className="order-2 relative flex justify-center md:justify-start">
                  <div
                    key={`img-${offer.id}-${activeIndex === index}`}
                    className="anim-fade-scale relative w-full max-w-[360px] sm:max-w-[400px] aspect-square rounded-[28px] bg-secondary/10 overflow-hidden"
                  >
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* شريط العروض المصغّرة */}
        <div className="mt-3 sm:mt-4 flex items-center gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {offers.map((offer, index) => (
            <button
              key={offer.id}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center gap-2.5 shrink-0 rounded-2xl border transition-all duration-300 p-2 pl-3.5 hover:-translate-y-0.5 active:scale-95 ${
                index === activeIndex
                  ? "anim-pop border-primary bg-primary/5 scale-[1.02]"
                  : "border-secondary/25 hover:border-secondary/50"
              }`}
            >
              <span className="w-12 h-12 rounded-xl bg-secondary/10 overflow-hidden shrink-0">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-contain p-1"
                />
              </span>
              <span className="text-right">
                <span className="block text-[12.5px] font-bold text-darkText leading-tight">
                  {offer.title}
                </span>
                <span className="block text-[11.5px] text-secondary mt-0.5">
                  {offer.newPrice} ج.م
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
