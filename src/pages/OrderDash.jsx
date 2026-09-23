import { useEffect, useState } from "react";
import {
  Phone,
  MessageCircle,
  MapPin,
  Banknote,
  Zap,
  Smartphone,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  PackageCheck,
  Calendar,
  Filter,
  Search,
  Building2,
  Home,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

// ── نفس مدن الـ Checkout عشان نعرض الاسم العربي بدل الـ id (احتياطي لو cityLabel مش محفوظة) ──
const cityLabels = {
  cairo: "القاهرة",
  giza: "الجيزة",
  fayoum: "الفيوم",
  "beni-suef": "بني سويف",
  minya: "المنيا",
  assiut: "أسيوط",
  sohag: "سوهاج",
  qena: "قنا",
  "nag-hammadi": "نجع حمادي",
  luxor: "الأقصر",
  aswan: "أسوان",
  alexandria: "الإسكندرية",
  tanta: "طنطا",
  mahalla: "المحلة الكبرى",
  mansoura: "المنصورة",
  suez: "السويس",
  beheira: "البحيرة",
  sharqia: "الشرقية",
  "10th-of-ramadan": "العاشر من رمضان",
  "port-said": "بورسعيد",
  ismailia: "الإسماعيلية",
  damietta: "دمياط",
  "kafr-elsheikh": "كفر الشيخ",
  qalyubia: "القليوبية",
  "al-gharbia": "الغربية",
  monufia: "المنوفية",
  dakahlia: "الدقهلية",
  "north-coast": "الساحل الشمالي",
  "marsa-matrouh": "مرسى مطروح",
  hurghada: "الغردقة",
  "sharm-el-sheikh": "شرم الشيخ",
  "marsa-alam": "مرسى علم",
  banha: "بنها",
  badrashin: "البدرشين",
  hawamdeya: "الحوامدية",
  saqqara: "سقارة",
  "badr-city": "مدينة بدر",
};

const paymentLabels = {
  cash: "الدفع عند الاستلام",
  instapay: "Instapay",
  "vodafone cash": "فودافون كاش",
};

const paymentIcons = {
  cash: Banknote,
  instapay: Zap,
  "vodafone cash": Smartphone,
};

const statusOptions = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "processing", label: "قيد التجهيز" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const filterOptions = [{ value: "all", label: "الكل" }, ...statusOptions];

const cityFilterOptions = [
  { value: "all", label: "المحافظات" },
  ...Object.entries(cityLabels).map(([value, label]) => ({ value, label })),
];

const paymentFilterOptions = [
  { value: "all", label: "طرق الدفع" },
  ...Object.entries(paymentLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

// ألوان الـ select الخاص بالحالة
const statusStyles = {
  pending: "bg-secondary/10 text-darkText/70 border-secondary/30",
  processing: "bg-accent/10 text-accent border-accent/30",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

// ألوان الكارد كله حسب الحالة
const cardStyles = {
  pending: "bg-white border-secondary/30",
  processing: "bg-accent/5 border-accent/30",
  completed: "bg-green-50/60 border-green-200",
  cancelled: "bg-red-50/40 border-red-200",
};

const toWhatsappLink = (number) => {
  if (!number) return null;
  const digitsOnly = number.replace(/\D/g, "");
  return `https://wa.me/2${digitsOnly}`;
};

export default function OrderDash() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, key: number }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 8;

  // Delete popup
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // إظهار التوست ثم إخفاؤه تلقائيًا بعد 3 ثواني
  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ── الاستماع اللحظي للطلبات: أي إضافة/تعديل/حذف في Firestore
  // بيتحدث في الشاشة فورًا من غير الحاجة لعمل refresh ──
  useEffect(() => {
    const ordersQuery = query(
      collection(db, "Orders"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to orders:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "غير محدد";

    return timestamp.toDate().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // بيرجع الاسم العربي للمحافظة: من الحقل المحفوظ cityLabel لو موجود، وإلا من جدول الترجمة، وإلا الكود نفسه
  const getCityLabel = (order) =>
    order.cityLabel || cityLabels[order.city] || order.city;

  // ---------------- Filter + Search ----------------

  const statusFilteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => (order.status || "pending") === statusFilter);

  const cityFilteredOrders =
    cityFilter === "all"
      ? statusFilteredOrders
      : statusFilteredOrders.filter((order) => order.city === cityFilter);

  const paymentFilteredOrders =
    paymentFilter === "all"
      ? cityFilteredOrders
      : cityFilteredOrders.filter(
          (order) => order.paymentMethod === paymentFilter,
        );

  const filteredOrders = (() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return paymentFilteredOrders;

    return paymentFilteredOrders.filter((order) => {
      const haystack = [
        order.fullName,
        order.phone,
        order.whatsapp,
        order.orderNumber,
        order.area,
        getCityLabel(order),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  })();

  // ---------------- Pagination ----------------

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const startIndex = (currentPage - 1) * ordersPerPage;

  const currentOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  // تصحيح رقم الصفحة تلقائيًا لو بقى أكبر من عدد الصفحات المتاحة
  // (بسبب فلترة جديدة أو حذف طلب من مستخدم تاني عبر onSnapshot)
  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(filteredOrders.length / ordersPerPage),
    );
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredOrders.length, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCityFilterChange = (value) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  const handlePaymentFilterChange = (value) => {
    setPaymentFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // ---------------- Status update ----------------

  const handleStatusChange = async (orderId, newStatus) => {
    const previousOrders = orders;

    // تحديث فوري في الشاشة (اختياري الآن بسبب onSnapshot، لكن بيخلي الاستجابة أسرع)
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );

    setUpdatingId(orderId);

    try {
      await updateDoc(doc(db, "Orders", orderId), { status: newStatus });

      showToast("تم تحديث حالة الطلب");
    } catch (error) {
      console.error("Error updating status:", error);

      showToast("حصل خطأ أثناء تحديث الحالة");

      // رجوع للحالة القديمة لو فشل التحديث
      setOrders(previousOrders);
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------------- Delete ----------------

  const openDeletePopup = (order) => {
    setOrderToDelete(order);
  };

  const closeDeletePopup = () => {
    if (!isDeleting) {
      setOrderToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "Orders", orderToDelete.id));

      // ملحوظة: onSnapshot هيحدّث القائمة تلقائيًا بعد نجاح الحذف،
      // لكن سيبنا التحديث اليدوي هنا كمان عشان تجربة استخدام أسرع بصريًا
      setOrders((prev) =>
        prev.filter((order) => order.id !== orderToDelete.id),
      );

      setOrderToDelete(null);

      const newTotalPages = Math.ceil(
        (filteredOrders.length - 1) / ordersPerPage,
      );

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      showToast("تم حذف الطلب");
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("حصل خطأ أثناء حذف الطلب");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      {/* Toast */}
      <div className="fixed top-5 inset-x-0 z-[200] flex justify-center pointer-events-none px-4">
        {toast && (
          <div
            key={toast.key}
            className="toast-anim pointer-events-auto flex items-center gap-2.5 bg-primary text-customBg px-5 py-3 rounded-full shadow-lg max-w-[90vw]"
          >
            <CheckCircle2 size={20} className="text-accent shrink-0" />
            <span className="text-base font-medium">{toast.message}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-anim { animation: toastIn 0.3s ease-out both; }
      `}</style>

      {/* العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-3xl font-bold text-darkText">
            الطلبات
          </h2>
          <p className="text-base text-darkText/50 mt-1">
            إدارة طلبات العملاء ومتابعتها
          </p>
        </div>
        {orders.length > 0 && (
          <span className="text-base text-darkText/50">
            {filteredOrders.length} طلبات
          </span>
        )}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-darkText/40 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-secondary/40 rounded-lg px-3 py-2.5 bg-white text-base text-darkText outline-none focus:border-primary"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={cityFilter}
          onChange={(e) => handleCityFilterChange(e.target.value)}
          className="border border-secondary/40 rounded-lg px-3 py-2.5 bg-white text-base text-darkText outline-none focus:border-primary"
        >
          {cityFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => handlePaymentFilterChange(e.target.value)}
          className="border border-secondary/40 rounded-lg px-3 py-2.5 bg-white text-base text-darkText outline-none focus:border-primary"
        >
          {paymentFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* شريط البحث */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute top-1/2 -translate-y-1/2 right-3.5 text-darkText/40"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="بحث بالاسم، رقم الهاتف، رقم الطلب، أو المنطقة..."
          className="w-full border border-secondary/40 rounded-lg py-3 pr-11 pl-4 bg-white text-base text-darkText outline-none focus:border-primary placeholder:text-darkText/30"
        />
      </div>

      {/* Loading */}
      {loading && <p className="text-base text-darkText/60">جاري التحميل...</p>}

      {/* لا توجد طلبات */}
      {!loading && filteredOrders.length === 0 && (
        <div className="text-center py-10">
          <PackageCheck size={40} className="mx-auto text-darkText/20 mb-3" />
          <p className="text-base text-darkText/60">
            {orders.length === 0
              ? "لم يتم استلام أي طلبات حتى الآن."
              : "لا يوجد طلبات مطابقة لبحثك أو الفلاتر المختارة."}
          </p>
        </div>
      )}

      {/* الطلبات */}
      {!loading && filteredOrders.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {currentOrders.map((order) => {
              const status = order.status || "pending";
              const PaymentIcon = paymentIcons[order.paymentMethod] || Banknote;
              const itemsCount =
                order.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) ||
                0;
              const whatsappLink = toWhatsappLink(order.whatsapp);

              return (
                <div
                  key={order.id}
                  className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                    cardStyles[status] || cardStyles.pending
                  }`}
                >
                  {/* الرأس */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-darkText truncate">
                        {order.fullName}
                      </p>
                      <p className="text-sm text-darkText/50 mt-1 truncate">
                        {order.orderNumber}
                      </p>
                    </div>

                    <button
                      onClick={() => openDeletePopup(order)}
                      aria-label="حذف الطلب"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* بيانات التواصل */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${order.phone}`}
                      className="flex items-center gap-1.5 text-base text-darkText/70 bg-secondary/10 hover:bg-secondary/20 transition px-3 py-1.5 rounded-full"
                    >
                      <Phone size={16} className="text-primary shrink-0" />
                      <span className="font-semibold text-darkText">
                        رقم التليفون:
                      </span>
                      <span dir="ltr">{order.phone}</span>
                    </a>

                    {order.whatsapp && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-base text-darkText/70 bg-secondary/10 hover:bg-secondary/20 transition px-3 py-1.5 rounded-full"
                      >
                        <MessageCircle
                          size={16}
                          className="text-primary shrink-0"
                        />
                        <span className="font-semibold text-darkText">
                          واتساب:
                        </span>
                        <span dir="ltr">{order.whatsapp}</span>
                      </a>
                    )}
                  </div>

                  {/* بيانات العنوان */}
                  <div className="space-y-1.5 text-base">
                    <div className="flex items-start gap-2">
                      <Building2
                        size={17}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <span className="text-darkText/70">
                        <span className="font-semibold text-darkText">
                          المحافظة:{" "}
                        </span>
                        {getCityLabel(order)}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        size={17}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <span className="text-darkText/70">
                        <span className="font-semibold text-darkText">
                          المنطقة:{" "}
                        </span>
                        {order.area}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Home
                        size={17}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <span className="text-darkText/70">
                        <span className="font-semibold text-darkText">
                          العنوان:{" "}
                        </span>
                        {order.address || "—"}
                        {order.floor ? ` - الدور ${order.floor}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* الدفع والتاريخ */}
                  <div className="space-y-1.5 text-base">
                    <div className="flex items-center gap-2">
                      <PaymentIcon
                        size={17}
                        className="text-primary shrink-0"
                      />
                      <span className="text-darkText/70">
                        <span className="font-semibold text-darkText">
                          طريقة الدفع:{" "}
                        </span>
                        {paymentLabels[order.paymentMethod] ||
                          order.paymentMethod}
                      </span>
                    </div>

                    {order.senderPhone && (
                      <div className="flex items-start gap-2 pr-6">
                        <span className="text-darkText/70">
                          <span className="font-semibold text-darkText">
                            رقم المرسل:{" "}
                          </span>
                          <span dir="ltr">{order.senderPhone}</span>
                        </span>
                      </div>
                    )}

                    {order.vodafoneReference && (
                      <div className="flex items-start gap-2 pr-6">
                        <span className="text-darkText/70">
                          <span className="font-semibold text-darkText">
                            كود فودافون كاش:{" "}
                          </span>
                          <span dir="ltr">{order.vodafoneReference}</span>
                        </span>
                      </div>
                    )}

                    {order.referenceNumber && (
                      <div className="flex items-start gap-2 pr-6">
                        <span className="text-darkText/70">
                          <span className="font-semibold text-darkText">
                            رقم المرجع:{" "}
                          </span>
                          <span dir="ltr">{order.referenceNumber}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-sm text-darkText/50">
                      <Calendar size={14} />
                      {formatDate(order.createdAt)}
                    </div>

                    {order.guestId && (
                      <div className="flex items-center gap-1.5 text-sm text-darkText/50">
                        <Fingerprint size={14} />
                        <span className="font-semibold text-darkText/60">
                          معرف الزائر:{" "}
                        </span>
                        <span dir="ltr" className="break-all">
                          {order.guestId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* المنتجات */}
                  {order.items?.length > 0 && (
                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3">
                      <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={item.productId || idx}
                            className="flex items-center gap-3 text-base"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 rounded-lg object-cover border border-secondary/30 shrink-0 bg-white"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-darkText truncate font-bold">
                                {item.name}
                              </p>
                              <p className="text-darkText/60 text-sm mt-0.5">
                                {item.price} ج.م ×{" "}
                                <span className="font-semibold">
                                  {item.quantity}
                                </span>
                              </p>
                            </div>
                            <span className="text-darkText font-bold shrink-0">
                              {item.total} ج.م
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-darkText/50 text-sm mt-2">
                        {itemsCount} منتج
                      </p>
                    </div>
                  )}

                  {/* تفاصيل الفاتورة */}
                  <div className="space-y-1 text-base">
                    <div className="flex items-center justify-between text-darkText/70">
                      <span>الإجمالي الفرعي</span>
                      <span>{order.subtotal?.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex items-center justify-between text-darkText/70">
                      <span>الشحن</span>
                      <span>{order.shippingFee?.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {/* الإجمالي + الحالة */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-secondary/20">
                    <div>
                      <p className="text-sm text-darkText/50">الإجمالي الكلي</p>
                      <span className="text-xl font-extrabold text-accent">
                        {order.grandTotal?.toFixed(2)} ج.م
                      </span>
                    </div>

                    <select
                      value={status}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className={`border rounded-lg px-2.5 py-2 text-base font-semibold outline-none focus:border-primary transition-all disabled:opacity-60 ${statusStyles[status]}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="الصفحة السابقة"
                className="w-9 h-9 rounded-full bg-secondary/15 text-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary/25 transition"
              >
                <ChevronRight size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                      currentPage === page
                        ? "bg-primary text-customBg"
                        : "bg-secondary/15 text-darkText hover:bg-secondary/25"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="الصفحة التالية"
                className="w-9 h-9 rounded-full bg-secondary/15 text-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary/25 transition"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal تأكيد الحذف */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={closeDeletePopup}
              disabled={isDeleting}
              className="absolute top-3 left-3 text-darkText/50 hover:text-darkText disabled:opacity-50"
            >
              <X size={18} />
            </button>
            <h3 className="font-heading text-xl font-bold text-darkText mb-2">
              تأكيد الحذف
            </h3>
            <p className="text-base text-darkText/70 mb-6">
              متأكد إنك عايز تحذف طلب{" "}
              <span className="font-bold text-darkText">
                "{orderToDelete.orderNumber}"
              </span>{" "}
              الخاص بـ{" "}
              <span className="font-bold text-darkText">
                {orderToDelete.fullName}
              </span>
              ؟ الإجراء ده مش هينفع يترجع فيه.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-full bg-red-600 text-white font-bold text-base hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  "تأكيد الحذف"
                )}
              </button>
              <button
                onClick={closeDeletePopup}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-full border border-secondary/50 text-darkText font-medium text-base hover:bg-secondary/10 transition disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
