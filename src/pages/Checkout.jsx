import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import {
  User,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Banknote,
  Zap,
  Smartphone,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Copy,
  Check,
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { useCart } from "../hooks/useCart";
import { useCatalog } from "../hooks/useCatalog";

/* =======================
   Zod Schema
======================= */
const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "من فضلك أدخل اسم صحيح")
      .max(40, "من فضلك أدخل اسم صحيح")
      .regex(/^[A-Za-z\u0600-\u06FF\s]+$/, "من فضلك أدخل اسم صحيح."),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "يجب إدخال رقم هاتف مصري صحيح"),
    whatsapp: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "من فضلك أدخل رقم واتساب مصري صحيح"),
    city: z.string().min(1, "من فضلك اختر المدينة"),
    area: z
      .string()
      .min(2, "الحي مطلوب")
      .max(50, "الحي طويل جدًا")
      .regex(/^[A-Za-z\u0600-\u06FF0-9\s]+$/, "صيغة الحي غير صحيحة"),
    address: z
      .string()
      .min(10, "العنوان مطلوب")
      .max(200, "العنوان طويل جدًا")
      .regex(/^[A-Za-z0-9\u0600-\u06FF\s,.-]+$/, "صيغة العنوان غير صحيحة"),
    floor: z
      .string()
      .regex(/^\d*$/, "الدور يجب أن يكون أرقامًا فقط")
      .optional(),
    paymentMethod: z.enum(["cash", "instapay", "vodafone"]),
    referenceNumber: z.string().optional(),
    senderPhone: z.string().optional(),
    vodafoneReference: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod !== "instapay") return true;

      const ref = data.referenceNumber?.trim() || "";
      if (ref === "") return false;
      if (!/^\d+$/.test(ref)) return false;
      if (ref.length < 8 || ref.length > 20) return false;

      return true;
    },
    {
      message: "رقم المرجع مطلوب",
      path: ["referenceNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "instapay") return true;
      const phone = data.senderPhone?.trim() || "";
      return phone !== "" && /^01[0125][0-9]{8}$/.test(phone);
    },
    {
      message: "من فضلك أدخل رقم هاتف صحيح",
      path: ["senderPhone"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "vodafone") return true;
      const phone = data.senderPhone?.trim() || "";
      return phone !== "" && /^01[0125][0-9]{8}$/.test(phone);
    },
    {
      message: "من فضلك أدخل رقم هاتف صحيح",
      path: ["senderPhone"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "vodafone") return true;
      const ref = data.vodafoneReference?.trim() || "";
      return ref !== "" && /^\d{6,20}$/.test(ref);
    },
    {
      message: "من فضلك أدخل رقم مرجع صحيح",
      path: ["vodafoneReference"],
    },
  );

// ── مدن مصر ──
const egyptCities = [
  { id: "cairo", label: "القاهرة" },
  { id: "giza", label: "الجيزة" },
  { id: "fayoum", label: "الفيوم" },
  { id: "beni-suef", label: "بني سويف" },
  { id: "minya", label: "المنيا" },
  { id: "assiut", label: "أسيوط" },
  { id: "sohag", label: "سوهاج" },
  { id: "qena", label: "قنا" },
  { id: "nag-hammadi", label: "نجع حمادي" },
  { id: "luxor", label: "الأقصر" },
  { id: "aswan", label: "أسوان" },
  { id: "alexandria", label: "الإسكندرية" },
  { id: "tanta", label: "طنطا" },
  { id: "mahalla", label: "المحلة الكبرى" },
  { id: "mansoura", label: "المنصورة" },
  { id: "suez", label: "السويس" },
  { id: "beheira", label: "البحيرة" },
  { id: "sharqia", label: "الشرقية" },
  { id: "10th-of-ramadan", label: "العاشر من رمضان" },
  { id: "port-said", label: "بورسعيد" },
  { id: "ismailia", label: "الإسماعيلية" },
  { id: "damietta", label: "دمياط" },
  { id: "kafr-elsheikh", label: "كفر الشيخ" },
  { id: "qalyubia", label: "القليوبية" },
  { id: "al-gharbia", label: "الغربية" },
  { id: "monufia", label: "المنوفية" },
  { id: "dakahlia", label: "الدقهلية" },
  { id: "north-coast", label: "الساحل الشمالي" },
  { id: "marsa-matrouh", label: "مرسى مطروح" },
  { id: "hurghada", label: "الغردقة" },
  { id: "sharm-el-sheikh", label: "شرم الشيخ" },
  { id: "marsa-alam", label: "مرسى علم" },
  { id: "banha", label: "بنها" },
  { id: "badrashin", label: "البدرشين" },
  { id: "hawamdeya", label: "الحوامدية" },
  { id: "saqqara", label: "سقارة" },
  { id: "badr-city", label: "مدينة بدر" },
];

const shippingFees = {
  cairo: 70,
  giza: 70,
  fayoum: 110,
  "beni-suef": 110,
  minya: 110,
  assiut: 110,
  sohag: 110,
  qena: 110,
  "nag-hammadi": 110,
  luxor: 110,
  aswan: 120,
  alexandria: 90,
  tanta: 100,
  mahalla: 100,
  mansoura: 100,
  suez: 100,
  beheira: 100,
  sharqia: 100,
  "10th-of-ramadan": 100,
  "port-said": 100,
  ismailia: 100,
  damietta: 100,
  "kafr-elsheikh": 100,
  qalyubia: 100,
  "al-gharbia": 100,
  monufia: 100,
  dakahlia: 100,
  "north-coast": 130,
  "marsa-matrouh": 130,
  hurghada: 140,
  "sharm-el-sheikh": 140,
  "marsa-alam": 140,
  banha: 85,
  badrashin: 85,
  hawamdeya: 85,
  saqqara: 90,
  "badr-city": 85,
};

const PAYMENT_METHODS = [
  { id: "cash", icon: Banknote, label: "الدفع عند الاستلام" },
  { id: "instapay", icon: Zap, label: "Instapay" },
  { id: "vodafone", icon: Smartphone, label: "فودافون كاش" },
];

const PAYMENT_LABELS = {
  cash: "الدفع عند الاستلام",
  "vodafone cash": "فودافون كاش",
  instapay: "Instapay",
};

// الأرقام اللي العميل يحوّل عليها (غيّرها بأرقامك الحقيقية)
const PAYMENT_ACCOUNTS = {
  instapay: "01XXXXXXXXX",
  vodafone: "01XXXXXXXXX",
};

const GUEST_KEY = "guestIdRawafid";

// معرّف ثابت للعميل على نفس المتصفح (بيتعمل مرة واحدة وبيتحفظ مع كل طلباته)
function getGuestId() {
  const fallback = () =>
    `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = crypto?.randomUUID ? crypto.randomUUID() : fallback();
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return fallback();
  }
}

const inputClass = (hasError) =>
  `w-full border rounded-xl px-4 py-2.5 text-base bg-customBg text-darkText outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-500 focus:ring-red-500/30"
      : "border-secondary/40 focus:ring-accent/30 focus:border-accent"
  }`;

function Field({ label, icon: Icon, error, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-2 text-sm font-bold text-darkText mb-1.5">
        {Icon && <Icon size={15} className="text-secondary" />}
        {label}
      </span>
      {children}
      {error && <p className="text-red-600 text-xs mt-1.5">{error.message}</p>}
    </label>
  );
}

// الرقم اللي العميل يحوّل عليه + زرار نسخ
function TransferNumber({ label, number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // لو النسخ مش متاح، العميل ينسخ الرقم يدوي
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-secondary/30 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm text-darkText/60 mb-0.5">{label}</p>
        <p className="text-lg font-bold text-primary tracking-wide" dir="ltr">
          {number}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label="نسخ الرقم"
        className="shrink-0 h-9 px-3 rounded-full bg-secondary/15 hover:bg-secondary/25 text-primary text-sm font-bold flex items-center gap-1.5 transition"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "تم النسخ" : "نسخ"}
      </button>
    </div>
  );
}

// قسم داخل الكارد الواحد (عنوان + فاصل من غير أرقام)
function Section({ title, first = false, children }) {
  return (
    <section className={first ? "" : "mt-8 pt-8 border-t border-secondary/30"}>
      <h3 className="flex items-center gap-2.5 font-heading text-xl font-bold text-primary mb-5">
        <span className="w-1.5 h-6 rounded-full bg-accent" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { items: catalog, loading: catalogLoading } = useCatalog();
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  // عناصر السلة بأسعارها الحالية من Firebase (اللي اتحذف من الكتالوج بيتشال)
  const cartItems = useMemo(
    () =>
      cart
        .map((c) => {
          const live = catalog.find((i) => i.id === c.id && i.type === c.type);
          if (!live) return null;
          return {
            id: live.id,
            type: live.type,
            name: live.name,
            image: live.image,
            price: live.price,
            quantity: c.quantity,
            total: live.price * c.quantity,
          };
        })
        .filter(Boolean),
    [cart, catalog],
  );

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const shippingCost = selectedCity ? shippingFees[selectedCity] || 0 : 0;
  const grandTotal = total + shippingCost;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onSubmit = async (data) => {
    if (cartItems.length === 0) return;
    setSubmitError("");

    try {
      const paymentMethodForDB =
        data.paymentMethod === "vodafone"
          ? "vodafone cash"
          : data.paymentMethod;

      const orderData = {
        guestId: getGuestId(),
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        cityLabel: egyptCities.find((c) => c.id === data.city)?.label || "",
        area: data.area,
        address: data.address,
        floor: data.floor || "",
        paymentMethod: paymentMethodForDB,
        ...(data.paymentMethod === "instapay" && {
          referenceNumber: data.referenceNumber,
          senderPhone: data.senderPhone,
        }),
        ...(data.paymentMethod === "vodafone" && {
          senderPhone: data.senderPhone,
          vodafoneReference: data.vodafoneReference,
        }),
        items: cartItems.map((item) => ({
          productId: item.id,
          type: item.type, // "product" أو "offer"
          name: item.name,
          image: item.image || "",
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
        subtotal: total,
        shippingFee: shippingCost,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      await addDoc(collection(db, "Orders"), orderData);

      clearCart();
      setPlacedOrder(orderData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error saving order:", error);
      setSubmitError("حصل خطأ أثناء تنفيذ الطلب، حاول تاني");
    }
  };

  const styles = (
    <style>{`
      @keyframes checkoutFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes checkoutPanelIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes successPop {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes successRing {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2); opacity: 0; }
      }
      .checkout-fade-up { animation: checkoutFadeUp 0.55s ease-out both; }
      .checkout-panel-in { animation: checkoutPanelIn 0.3s ease-out both; }
      .success-pop { animation: successPop 0.6s ease-out 0.15s both; }
      .success-ring { animation: successRing 1.6s ease-out 0.5s infinite; }
    `}</style>
  );

  /* ================= شاشة النجاح ================= */
  if (placedOrder) {
    return (
      <>
        <Navbar />
        <main
          dir="rtl"
          className="bg-customBg min-h-[70vh] py-10 md:py-16 px-4"
        >
          {styles}

          <div className="max-w-md mx-auto">
            {/* الهيدر الأخضر */}
            <div className="checkout-fade-up relative bg-primary rounded-t-3xl px-6 pt-10 pb-16 text-center overflow-hidden">
              <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/15" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-customBg/10" />

              <div className="relative mx-auto mb-5 w-20 h-20">
                <span className="success-ring absolute inset-0 rounded-full bg-accent/40" />
                <span className="success-pop relative flex w-20 h-20 items-center justify-center rounded-full bg-accent text-primary shadow-lg">
                  <Check size={40} strokeWidth={3} />
                </span>
              </div>

              <h2 className="relative font-heading text-3xl font-bold text-customBg mb-2">
                تم تأكيد طلبك
              </h2>
              <p className="relative text-customBg/80">
                شكرًا لك، {placedOrder.fullName.split(" ")[0]} تم استلام طلبك
                وجاري تجهيزه.
              </p>
            </div>

            {/* الإيصال */}
            <div
              className="checkout-fade-up relative -mt-8 bg-white rounded-3xl shadow-xl"
              style={{ animationDelay: "120ms" }}
            >
              <div className="px-6 pt-8 space-y-4">
                <div className="bg-customBg border border-secondary/30 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs text-darkText/60 mb-1">رقم الطلب</p>
                  <p
                    className="text-base font-bold text-primary tracking-wide"
                    dir="ltr"
                  >
                    {placedOrder.orderNumber}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-darkText/60">طريقة الدفع</span>
                  <span className="text-sm font-bold text-primary">
                    {PAYMENT_LABELS[placedOrder.paymentMethod]}
                  </span>
                </div>
              </div>

              {/* فاصل منقّط بنتشات على الجناب */}
              <div className="relative h-6 my-3">
                <div className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-secondary/40" />
                <span className="absolute top-0 -right-3 w-6 h-6 rounded-full bg-customBg" />
                <span className="absolute top-0 -left-3 w-6 h-6 rounded-full bg-customBg" />
              </div>

              <div className="px-6 pb-6 text-center">
                <p className="text-sm text-darkText/60 mb-1">إجمالي المبلغ</p>
                <p className="font-heading text-4xl font-bold text-accent">
                  {placedOrder.grandTotal} ج.م
                </p>
              </div>

              <div className="mx-6 mb-6 flex items-start gap-3 bg-accent/10 border border-accent/20 rounded-2xl p-4">
                <MessageCircle
                  size={22}
                  className="text-accent shrink-0 mt-0.5"
                />
                <p className="text-sm text-darkText/70 leading-6">
                  هنتواصل معاك على الواتساب (
                  <bdi className="font-bold text-primary">
                    {placedOrder.whatsapp}
                  </bdi>
                  ) لتأكيد تفاصيل التوصيل.
                </p>
              </div>

              <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/products"
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-customBg font-bold text-sm hover:opacity-90 transition"
                >
                  <ShoppingBag size={18} />
                  تابع التسوق
                </Link>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center h-12 rounded-full border border-secondary/50 text-darkText font-medium text-sm hover:bg-secondary/10 transition"
                >
                  الرجوع للرئيسية
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  /* ================= السلة فاضية ================= */
  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <main
          dir="rtl"
          className="bg-customBg min-h-[70vh] flex items-center justify-center px-4 py-14"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
              <ShoppingBag size={30} className="text-secondary" />
            </span>
            <h2 className="font-heading text-2xl font-bold text-primary">
              السلة فارغة
            </h2>
            <p className="text-base text-darkText/60 max-w-xs">
              أضف منتجات للسلة الأول عشان تقدر تكمل الطلب.
            </p>
            <Link
              to="/products"
              className="mt-2 inline-flex items-center h-11 px-8 rounded-full bg-primary text-customBg font-bold text-sm hover:opacity-90 transition"
            >
              تصفح المنتجات
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ================= فورم الـ Checkout ================= */
  return (
    <>
      <Navbar />

      <main dir="rtl" className="bg-customBg min-h-[70vh] py-8 md:py-12">
        {styles}

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8 md:mb-10 text-center">
            <p className="text-sm font-bold text-accent mb-2">خطوة أخيرة</p>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary">
              أكمل طلبك
            </h1>
          </div>

          {catalogLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* الفورم: كارد واحد فيه 3 أقسام */}
              <div className="lg:col-span-2">
                <div className="checkout-fade-up bg-white border border-secondary/30 rounded-2xl p-5 sm:p-8">
                  {/* بيانات التواصل */}
                  <Section title="بيانات التواصل" first>
                    <div className="space-y-4">
                      <Field
                        label="الاسم بالكامل"
                        icon={User}
                        error={errors.fullName}
                      >
                        <input
                          {...register("fullName")}
                          placeholder="اكتب اسمك بالكامل"
                          className={inputClass(errors.fullName)}
                        />
                      </Field>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="رقم الهاتف"
                          icon={Phone}
                          error={errors.phone}
                        >
                          <input
                            {...register("phone")}
                            placeholder="01XXXXXXXXX"
                            dir="ltr"
                            inputMode="tel"
                            className={`${inputClass(errors.phone)} text-right`}
                          />
                        </Field>

                        <Field
                          label="رقم الواتساب"
                          icon={MessageCircle}
                          error={errors.whatsapp}
                        >
                          <input
                            {...register("whatsapp")}
                            placeholder="01XXXXXXXXX"
                            dir="ltr"
                            inputMode="tel"
                            className={`${inputClass(errors.whatsapp)} text-right`}
                          />
                        </Field>
                      </div>
                    </div>
                  </Section>

                  {/* عنوان التوصيل */}
                  <Section title="عنوان التوصيل">
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="المدينة"
                          icon={MapPin}
                          error={errors.city}
                        >
                          <select
                            {...register("city")}
                            className={inputClass(errors.city)}
                          >
                            <option value="">اختر المدينة</option>
                            {egyptCities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.label}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field
                          label="الحي / المنطقة"
                          icon={Building2}
                          error={errors.area}
                        >
                          <input
                            {...register("area")}
                            placeholder="مثال: مدينة نصر"
                            className={inputClass(errors.area)}
                          />
                        </Field>
                      </div>

                      <Field label="العنوان بالتفصيل" error={errors.address}>
                        <textarea
                          {...register("address")}
                          rows={2}
                          placeholder="الشارع، رقم المبنى، أقرب علامة مميزة..."
                          className={`${inputClass(errors.address)} resize-none`}
                        />
                      </Field>

                      <Field
                        label="الدور (اختياري)"
                        error={errors.floor}
                        className="sm:w-1/2"
                      >
                        <input
                          {...register("floor")}
                          placeholder="مثال: 3"
                          inputMode="numeric"
                          className={inputClass(errors.floor)}
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* طريقة الدفع */}
                  <Section title="طريقة الدفع">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {PAYMENT_METHODS.map((method) => {
                        const selected = paymentMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <label
                            key={method.id}
                            className={`relative cursor-pointer rounded-2xl border-2 p-4 text-center transition ${
                              selected
                                ? "border-accent bg-accent/5"
                                : "border-secondary/30 hover:border-accent/50"
                            }`}
                          >
                            <input
                              type="radio"
                              value={method.id}
                              {...register("paymentMethod")}
                              className="sr-only"
                            />
                            {selected && (
                              <CheckCircle2
                                size={18}
                                className="absolute top-2.5 right-2.5 text-accent"
                              />
                            )}
                            <Icon
                              size={26}
                              className={`mx-auto mb-2 ${
                                selected ? "text-accent" : "text-darkText/50"
                              }`}
                            />
                            <p
                              className={`font-bold text-sm ${
                                selected ? "text-primary" : "text-darkText/70"
                              }`}
                            >
                              {method.label}
                            </p>
                          </label>
                        );
                      })}
                    </div>

                    {errors.paymentMethod && (
                      <p className="text-red-600 text-xs mt-3">
                        من فضلك اختر طريقة الدفع
                      </p>
                    )}

                    {paymentMethod === "instapay" && (
                      <div className="checkout-panel-in mt-5 space-y-4 bg-accent/5 border border-accent/20 rounded-2xl p-5">
                        <TransferNumber
                          label="حوّل على رقم Instapay"
                          number={PAYMENT_ACCOUNTS.instapay}
                        />

                        <Field
                          label="رقم هاتف المُحوِّل"
                          error={errors.senderPhone}
                        >
                          <input
                            {...register("senderPhone")}
                            placeholder="01XXXXXXXXX"
                            dir="ltr"
                            inputMode="tel"
                            className={`${inputClass(errors.senderPhone)} text-right`}
                          />
                        </Field>

                        <Field
                          label="رقم المرجع"
                          error={errors.referenceNumber}
                        >
                          <input
                            {...register("referenceNumber")}
                            placeholder="أدخل رقم المرجع الخاص بالتحويل"
                            inputMode="numeric"
                            className={inputClass(errors.referenceNumber)}
                          />
                        </Field>
                      </div>
                    )}

                    {paymentMethod === "vodafone" && (
                      <div className="checkout-panel-in mt-5 space-y-4 bg-accent/5 border border-accent/20 rounded-2xl p-5">
                        <TransferNumber
                          label="حوّل على رقم فودافون كاش"
                          number={PAYMENT_ACCOUNTS.vodafone}
                        />

                        <Field
                          label="رقم هاتف المُحوِّل"
                          error={errors.senderPhone}
                        >
                          <input
                            {...register("senderPhone")}
                            placeholder="01XXXXXXXXX"
                            dir="ltr"
                            inputMode="tel"
                            className={`${inputClass(errors.senderPhone)} text-right`}
                          />
                        </Field>

                        <Field
                          label="رقم العملية المرجعي"
                          error={errors.vodafoneReference}
                        >
                          <input
                            {...register("vodafoneReference")}
                            placeholder="اكتب رقم العملية المرجعي"
                            inputMode="numeric"
                            className={inputClass(errors.vodafoneReference)}
                          />
                        </Field>
                      </div>
                    )}
                  </Section>
                </div>
              </div>

              {/* ملخص الطلب (الخط أكبر هنا بس) */}
              <div
                className="checkout-fade-up lg:col-span-1"
                style={{ animationDelay: "150ms" }}
              >
                <div className="bg-white border border-secondary/30 rounded-2xl shadow-lg p-5 sm:p-6 lg:sticky lg:top-24">
                  <h3 className="font-heading text-2xl font-bold text-primary mb-5 flex items-center gap-2">
                    <PackageCheck size={22} className="text-accent" />
                    ملخص الطلب
                  </h3>

                  <ul className="space-y-4 mb-5 max-h-72 overflow-y-auto">
                    {cartItems.map((item) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-contain bg-secondary/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-darkText truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-darkText/60">
                            الكمية: {item.quantity}
                          </p>
                        </div>
                        <p className="text-base font-bold text-primary shrink-0">
                          {item.total} ج.م
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-secondary/30 pt-4 space-y-3">
                    <div className="flex justify-between text-base text-darkText/70">
                      <span>الإجمالي الفرعي</span>
                      <span className="font-bold text-primary">
                        {total} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-base text-darkText/70">
                      <span>الشحن</span>
                      <span className="font-bold text-primary">
                        {selectedCity ? `${shippingCost} ج.م` : "اختر المدينة"}
                      </span>
                    </div>
                    <div className="border-t border-secondary/30 pt-3 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-primary">
                        الإجمالي
                      </span>
                      <span className="text-3xl font-bold text-accent">
                        {grandTotal} ج.م
                      </span>
                    </div>
                  </div>

                  {submitError && (
                    <p className="mt-4 text-base text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                    className="w-full mt-6 h-12 rounded-full bg-primary text-customBg font-bold text-lg hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "جاري التنفيذ..." : "تأكيد الطلب"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
