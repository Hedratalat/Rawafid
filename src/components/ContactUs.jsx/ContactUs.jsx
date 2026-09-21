import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import { Phone, Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const COLLECTION_NAME = "Messages";

const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, "من فضلك أدخل اسم صحيح.")
    .max(50, "من فضلك أدخل اسم صحيح.")
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, "الاسم لازم يحتوي على حروف فقط"),
  email: z
    .string()
    .email("من فضلك أدخل بريد إلكتروني صحيح.")
    .refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return /^[a-zA-Z][a-zA-Z0-9._%+-]*@gmail\.(com|net|org)(\.eg)?$/.test(
          lowerVal,
        );
      },
      { message: "لازم يكون بريد Gmail صحيح" },
    ),
  phone: z
    .string()
    .regex(/^(\+2)?01[0125][0-9]{8}$/, "رقم الهاتف لازم يكون رقم مصري صحيح"),
  message: z
    .string()
    .min(10, "الرسالة لازم تكون 10 حروف على الأقل")
    .max(500, "الرسالة لازم تكون أقل من 500 حرف"),
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
        visible ? "contact-fade-up" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}

// القسم مش بيتعرض غير لما اليوزر يسكرول فعلًا ويوصل لمكانه.
// لحد كدا بيحجز مساحة فاضية في مكانه (عشان الصفحة متقفزش).
function useRevealOnScrollArrival() {
  const wrapperRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || ready) return;

    let inView = false;
    let hasScrolled = window.scrollY > 80;

    const tryShow = () => {
      if (inView && hasScrolled) setReady(true);
    };

    const onScroll = () => {
      if (window.scrollY > 80) {
        hasScrolled = true;
        tryShow();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        tryShow();
      },
      { rootMargin: "0px 0px 150px 0px" },
    );

    observer.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });

    // احتياط: لو الصفحة قصيرة ومفيهاش سكرول أصلًا
    const fallback = setTimeout(() => {
      const scrollable =
        document.documentElement.scrollHeight > window.innerHeight + 100;
      if (!scrollable && inView) setReady(true);
    }, 3000);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(fallback);
    };
  }, [ready]);

  return { wrapperRef, ready };
}

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.12L2 22l5.13-1.55a9.85 9.85 0 0 0 4.9 1.31h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.41 1.3-1.94 1.36-.5.06-1.05.28-3.53-.74-2.98-1.23-4.9-4.23-5.05-4.43-.15-.2-1.2-1.6-1.2-3.05 0-1.46.76-2.17 1.03-2.47.27-.3.59-.37.78-.37h.56c.18 0 .43-.02.66.5.24.55.82 2 .89 2.14.07.15.11.32.02.51-.1.2-.16.32-.31.5-.16.18-.33.4-.47.53-.16.15-.32.31-.14.62.19.32.85 1.4 1.83 2.27 1.26 1.12 2.33 1.47 2.68 1.63.26.12.42.1.58-.06.19-.2.85-.99 1.08-1.33.23-.34.46-.28.76-.17.31.11 1.97.93 2.3 1.1.34.17.56.25.65.38.09.14.09.79-.15 1.51Z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.6h2.55l.4-2.97h-2.95v-1.7c0-.86.24-1.44 1.47-1.44h1.57V4.98c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.16H8v2.97h2.46V21h3.04Z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.5c.7 1.1 1.9 1.9 3.4 2v2.6c-1.3 0-2.6-.4-3.7-1.1v5.6a5.4 5.4 0 1 1-4.6-5.35v2.7a2.7 2.7 0 1 0 2 2.6V2h2.7c.03.95.13 1.85.2 2.5v1Z" />
    </svg>
  );
}

// brand = لون الأيقونة العادي | soft = خلفية فاتحة | hoverBg = الخلفية وقت الـ hover
const SOCIAL_LINKS = [
  {
    icon: WhatsAppIcon,
    label: "واتساب",
    href: "https://wa.me/201012345678",
    brand: "#25D366",
    soft: "rgba(37, 211, 102, 0.12)",
    hoverBg: "#25D366",
  },
  {
    icon: FacebookIcon,
    label: "فيسبوك",
    href: "https://facebook.com",
    brand: "#1877F2",
    soft: "rgba(24, 119, 242, 0.12)",
    hoverBg: "#1877F2",
  },
  {
    icon: InstagramIcon,
    label: "إنستجرام",
    href: "https://instagram.com",
    brand: "#D62976",
    soft: "rgba(214, 41, 118, 0.12)",
    hoverBg:
      "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5 100%)",
  },
  {
    icon: TikTokIcon,
    label: "تيك توك",
    href: "https://tiktok.com",
    brand: "#111111",
    soft: "rgba(17, 17, 17, 0.08)",
    hoverBg: "#111111",
  },
];

const CONTACT_INFO = [
  {
    icon: Phone,
    label: "اتصل بينا",
    value: "01012345678",
    href: "tel:01012345678",
  },
  {
    icon: Mail,
    label: "إيميلنا",
    value: "info@example.com",
    href: "mailto:info@example.com",
  },
  {
    icon: MapPin,
    label: "عنواننا",
    value: "القاهرة، مصر",
    href: null,
  },
];

export default function ContactUs() {
  const [toast, setToast] = useState(null);
  const { wrapperRef, ready } = useRevealOnScrollArrival();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", email: "", phone: "", message: "" },
  });

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(data) {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        message: data.message,
        createdAt: serverTimestamp(),
      });
      showToast("تم إرسال رسالتك، هنتواصل معاك قريبًا");
      reset({ fullName: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error("Error submitting message:", err);
      showToast("حصل خطأ، حاول تاني");
    }
  }

  return (
    <div ref={wrapperRef} className={ready ? "" : "min-h-[700px]"}>
      {ready && (
        <section
          id="contact"
          dir="rtl"
          className="scroll-mt-24  bg-customBg pt-0 pb-14 md:pb-16"
        >
          <style>{`
            @keyframes contactToastIn {
              from { opacity: 0; transform: translateY(-14px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes contactFadeUp {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .contact-toast-in { animation: contactToastIn 0.3s ease-out both; }
            .contact-fade-up { animation: contactFadeUp 0.6s ease-out both; }

            .social-btn {
              position: relative;
              width: 56px;
              height: 56px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--brand);
              background: var(--soft);
              overflow: hidden;
              transition: transform 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
            }
            .social-btn::before {
              content: "";
              position: absolute;
              inset: 0;
              background: var(--hover-bg);
              opacity: 0;
              transform: scale(0.6);
              transition: opacity 0.25s ease, transform 0.3s ease;
            }
            .social-btn > svg {
              position: relative;
              z-index: 1;
            }
            .social-item:hover .social-btn,
            .social-item:focus-visible .social-btn {
              color: #fff;
              transform: translateY(-4px);
              box-shadow: 0 12px 22px -10px var(--brand);
            }
            .social-item:hover .social-btn::before,
            .social-item:focus-visible .social-btn::before {
              opacity: 1;
              transform: scale(1);
            }
            .social-item:focus-visible { outline: none; }
            .social-item:focus-visible .social-btn {
              outline: 2px solid var(--brand);
              outline-offset: 3px;
            }
            @media (prefers-reduced-motion: reduce) {
              .contact-fade-up, .contact-toast-in { animation: none; }
              .social-btn, .social-btn::before { transition: none; }
            }
          `}</style>

          {/* Toast */}
          <div className="fixed top-5 inset-x-0 z-[300] flex justify-center pointer-events-none px-4">
            {toast && (
              <div
                key={toast.key}
                className="contact-toast-in pointer-events-auto flex items-center gap-2.5 bg-accent text-darkText px-5 py-3 rounded-full shadow-lg max-w-[90vw]"
              >
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span className="text-sm font-bold">{toast.message}</span>
              </div>
            )}
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <RevealBlock className="text-center mb-10 md:mb-14">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
                تواصل معنا
              </h2>
              <p className="mt-2 text-base text-darkText/60 max-w-md mx-auto">
                عندك سؤال أو استفسار؟ راسلنا وهنرد عليك في أقرب وقت
              </p>
            </RevealBlock>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* معلومات التواصل */}
              <RevealBlock>
                <div className="flex flex-col gap-4">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => {
                    const content = (
                      <div className="bg-white border border-secondary/20 rounded-3xl p-5 md:p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/15 text-primary flex items-center justify-center shrink-0">
                          <Icon size={20} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-darkText/50">
                            {label}
                          </span>
                          <span className="font-heading font-bold text-darkText">
                            {value}
                          </span>
                        </div>
                      </div>
                    );

                    return href ? (
                      <a
                        key={label}
                        href={href}
                        className="hover:opacity-80 transition"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={label}>{content}</div>
                    );
                  })}

                  {/* روابط السوشيال ميديا */}
                  <div className="bg-white border border-secondary/20 rounded-3xl p-5 md:p-6 flex flex-col items-center gap-5 text-center">
                    <span className="text-sm font-bold text-darkText">
                      تابعنا على مواقع التواصل الاجتماعي
                    </span>
                    <div className="flex items-start justify-center gap-5 sm:gap-7">
                      {SOCIAL_LINKS.map(
                        ({ icon: Icon, label, href, brand, soft, hoverBg }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            style={{
                              "--brand": brand,
                              "--soft": soft,
                              "--hover-bg": hoverBg,
                            }}
                            className="social-item flex flex-col items-center gap-2"
                          >
                            <span className="social-btn">
                              <Icon className="w-6 h-6" />
                            </span>
                            <span className="text-xs text-darkText/60">
                              {label}
                            </span>
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </RevealBlock>

              {/* الفورم */}
              <RevealBlock>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="bg-white border border-secondary/20 rounded-3xl p-6 md:p-8 flex flex-col gap-4"
                >
                  <h3 className="font-heading text-xl font-bold text-darkText">
                    ابعتلنا رسالة
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-darkText">
                      اسمك
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="اكتب اسمك"
                      className={`h-11 rounded-lg border px-3 text-sm outline-none text-darkText ${
                        errors.fullName
                          ? "border-red-400 focus:border-red-500"
                          : "border-secondary/40 focus:border-primary"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-darkText">
                      بريدك الإلكتروني
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="example@email.com"
                      className={`h-11 rounded-lg border px-3 text-sm outline-none text-darkText ${
                        errors.email
                          ? "border-red-400 focus:border-red-500"
                          : "border-secondary/40 focus:border-primary"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-darkText">
                      رقم الهاتف
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                      className={`h-11 rounded-lg border px-3 text-sm outline-none text-darkText ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500"
                          : "border-secondary/40 focus:border-primary"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-darkText">
                      رسالتك
                    </label>
                    <textarea
                      {...register("message")}
                      rows={4}
                      placeholder="اكتب رسالتك هنا..."
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
                    {isSubmitting ? (
                      "جاري الإرسال..."
                    ) : (
                      <>
                        <Send size={16} />
                        إرسال الرسالة
                      </>
                    )}
                  </button>
                </form>
              </RevealBlock>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
