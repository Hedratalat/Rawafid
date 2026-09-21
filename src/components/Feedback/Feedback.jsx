import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import {
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const COLLECTION_NAME = "Feedback";

const feedbackSchema = z.object({
  name: z
    .string()
    .nonempty("من فضلك املأ جميع الحقول")
    .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل")
    .max(30)
    .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, "حروف ومسافات فقط"),
  rating: z.number().min(1, "من فضلك اختار تقييم بالنجوم").max(5),
  message: z
    .string()
    .nonempty("من فضلك املأ جميع الحقول")
    .min(10, "الرأي يجب أن يكون 10 أحرف على الأقل")
    .max(400),
});

// عنصر مستقل بحاله بيظهر بحركته الخاصة أول ما يوصله السكرول
function RevealBlock({ children, className = "" }) {
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
      className={`${className} ${
        visible ? "feedback-fade-up" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}

// بيحدد كام كارت يظهروا حسب حجم الشاشة: 3 لارج / 2 سمول / 1 موبايل
function useVisibleCount() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    function update() {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 640) setCount(2);
      else setCount(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

const MAX_DOTS = 8;

export default function Feedback() {
  const [hoverRating, setHoverRating] = useState(0);
  const [toast, setToast] = useState(null);

  const [approvedFeedback, setApprovedFeedback] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleCount = useVisibleCount();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    mode: "onChange",
    defaultValues: { name: "", rating: 0, message: "" },
  });

  const currentRating = watch("rating");

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // جلب الآراء المعتمدة بس (من غير orderBy عشان نتجنب composite index)
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("approved", "==", true),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
        );
        setApprovedFeedback(list);
        setLoadingFeedback(false);
      },
      (err) => {
        console.error("Error fetching feedback:", err);
        setLoadingFeedback(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeIndex >= approvedFeedback.length) setActiveIndex(0);
  }, [approvedFeedback, activeIndex]);

  // السلايدر شغال بس لو عدد الآراء أكبر من عدد الكروت الظاهرة دلوقتي
  const sliderActive = approvedFeedback.length > visibleCount;

  // تحريك السلايدر تلقائيًا كل 4 ثواني (بس لو محتاج فعلاً يتحرك)
  useEffect(() => {
    if (!sliderActive) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % approvedFeedback.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderActive, approvedFeedback.length]);

  async function onSubmit(data) {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        name: data.name,
        rating: data.rating,
        message: data.message,
        approved: false,
        createdAt: serverTimestamp(),
      });
      showToast("تم إرسال رأيك، شكرًا لك");
      reset({ name: "", rating: 0, message: "" });
      setHoverRating(0);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      showToast("حصل خطأ، حاول تاني");
    }
  }

  function goPrev() {
    setActiveIndex((prev) =>
      prev === 0 ? approvedFeedback.length - 1 : prev - 1,
    );
  }

  function goNext() {
    setActiveIndex((prev) => (prev + 1) % approvedFeedback.length);
  }

  // بننتظر تحميل الآراء عشان القسم ميظهرش قبل باقي الأقسام
  if (loadingFeedback) return null;

  const visibleItems = approvedFeedback.length
    ? Array.from(
        { length: Math.min(visibleCount, approvedFeedback.length) },
        (_, i) => approvedFeedback[(activeIndex + i) % approvedFeedback.length],
      )
    : [];

  return (
    <section dir="rtl" className="bg-customBg  pt-0 pb-14 md:pb-16">
      <style>{`
        @keyframes feedbackToastIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes feedbackFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes feedbackSlideIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .feedback-toast-in { animation: feedbackToastIn 0.3s ease-out both; }
        .feedback-fade-up { animation: feedbackFadeUp 0.6s ease-out both; }
        .feedback-slide-in { animation: feedbackSlideIn 0.35s ease-out both; }
      `}</style>

      {/* Toast */}
      <div className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none px-4">
        {toast && (
          <div
            key={toast.key}
            className="feedback-toast-in pointer-events-auto flex items-center gap-2.5 bg-accent text-darkText px-5 py-3 rounded-full shadow-lg max-w-[90vw]"
          >
            <CheckCircle2 size={18} className="text-primary shrink-0" />
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <RevealBlock className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
            آراء عملائنا
          </h2>
          <p className="mt-2 text-base text-darkText/60 max-w-md mx-auto">
            رأيك بيهمنا، شاركنا تجربتك معانا
          </p>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* السلايدر */}
          <RevealBlock className="order-1">
            {approvedFeedback.length === 0 ? (
              <div className="bg-white border border-secondary/20 rounded-2xl p-8 text-center">
                <p className="text-sm text-darkText/60">
                  لسه معندناش آراء لعرضها، كن أول من يشاركنا رأيه!
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="flex flex-col gap-4">
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="feedback-slide-in bg-white border border-secondary/20 rounded-3xl p-6 md:p-8 flex flex-col gap-4"
                    >
                      <Quote size={32} className="text-primary/25" />

                      <p className="text-sm md:text-base leading-7 text-darkText/80">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < item.rating
                                ? "fill-accent text-accent"
                                : "text-secondary/30"
                            }
                          />
                        ))}
                      </div>

                      <p className="font-heading font-bold text-darkText">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>

                {sliderActive && (
                  <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                      onClick={goPrev}
                      aria-label="الرأي السابق"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition shrink-0"
                    >
                      <ChevronRight size={18} />
                    </button>

                    {approvedFeedback.length > MAX_DOTS ? (
                      <span className="text-sm font-bold text-darkText/70 min-w-[70px] text-center">
                        {activeIndex + 1} من {approvedFeedback.length}
                      </span>
                    ) : (
                      <div className="flex items-center flex-wrap justify-center gap-1.5 max-w-[220px]">
                        {approvedFeedback.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            aria-label={`رأي ${i + 1}`}
                            className={`h-2 rounded-full transition-all ${
                              i === activeIndex
                                ? "w-6 bg-primary"
                                : "w-2 bg-secondary/30"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={goNext}
                      aria-label="الرأي التالي"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition shrink-0"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </RevealBlock>

          {/* الفورم */}
          <RevealBlock className="order-2">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white border border-secondary/20 rounded-3xl p-6 md:p-8 flex flex-col gap-4"
            >
              <h3 className="font-heading text-xl font-bold text-darkText">
                شاركنا رأيك
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-darkText">
                  اسمك
                </label>
                <input
                  {...register("name")}
                  placeholder="اكتب اسمك"
                  className={`h-11 rounded-lg border px-3 text-sm outline-none text-darkText ${
                    errors.name
                      ? "border-red-400 focus:border-red-500"
                      : "border-secondary/40 focus:border-primary"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-darkText">
                  تقييمك
                </label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => {
                    const starValue = i + 1;
                    const filled = starValue <= (hoverRating || currentRating);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setValue("rating", starValue, {
                            shouldValidate: true,
                          })
                        }
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${starValue} نجوم`}
                      >
                        <Star
                          size={26}
                          className={
                            filled
                              ? "fill-accent text-accent transition"
                              : "text-secondary/30 transition"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
                {errors.rating && (
                  <p className="text-red-500 text-xs">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-darkText">
                  رأيك
                </label>
                <textarea
                  {...register("message")}
                  rows={4}
                  placeholder="احكيلنا عن تجربتك..."
                  className={`rounded-lg border px-3 py-2 text-sm outline-none text-darkText resize-none ${
                    errors.message
                      ? "border-red-400 focus:border-red-500"
                      : "border-secondary/40 focus:border-primary"
                  }`}
                />
                {errors.message && (
                  <p className="text-red-500 text-xs">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-full bg-accent text-customBg font-bold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال الرأي"}
              </button>
            </form>
          </RevealBlock>
        </div>
      </div>
    </section>
  );
}
