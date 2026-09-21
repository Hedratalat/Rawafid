import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Pencil,
  Trash2,
  X,
  Plus,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Images,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const COLLECTION_NAME = "OffersSection";
const OFFERS_PER_PAGE = 8;

const EMPTY_FORM = {
  badge: "",
  title: "",
  description: "",
  image: "",
  images: [],
  oldPrice: "",
  newPrice: "",
  order: "",
};

export default function OfferDashboard() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalPages = Math.max(1, Math.ceil(offers.length / OFFERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * OFFERS_PER_PAGE;
  const paginatedOffers = offers.slice(
    startIndex,
    startIndex + OFFERS_PER_PAGE,
  );

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleImageFieldChange(index, value) {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = value;
      return { ...prev, images: updated };
    });
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  }

  function removeImageField(index) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function startEdit(offer) {
    setEditingId(offer.id);
    setForm({
      badge: offer.badge,
      title: offer.title,
      description: offer.description,
      image: offer.image,
      images: Array.isArray(offer.images) ? offer.images : [],
      oldPrice: offer.oldPrice,
      newPrice: offer.newPrice,
      order: offer.order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const finalOrder =
        form.order === "" || form.order === null
          ? offers.length === 0
            ? 1
            : Math.max(...offers.map((o) => Number(o.order) || 0)) + 1
          : Number(form.order);

      const cleanedImages = form.images
        .map((img) => img.trim())
        .filter((img) => img !== "");

      const dataToSave = {
        ...form,
        images: cleanedImages,
        order: finalOrder,
      };

      if (editingId) {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), dataToSave);
        showToast("تم تعديل العرض بنجاح");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        showToast("تم إضافة العرض بنجاح");
      }
      cancelEdit();
    } catch (err) {
      console.error("Error saving offer");
    }
  }

  async function moveOffer(index, direction) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= offers.length) return;

    const current = offers[index];
    const target = offers[targetIndex];

    try {
      await updateDoc(doc(db, COLLECTION_NAME, current.id), {
        order: target.order,
      });
      await updateDoc(doc(db, COLLECTION_NAME, target.id), {
        order: current.order,
      });
    } catch (err) {
      console.error("Error reordering offers:", err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, deleteTarget.id));
      if (editingId === deleteTarget.id) cancelEdit();
      showToast("تم حذف العرض بنجاح");
    } catch (err) {
      console.error("Error deleting offer:", err);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      {/* Toast */}
      <div className="fixed top-5 inset-x-0 z-[200] flex justify-center pointer-events-none px-4">
        {toast && (
          <div
            key={toast.key}
            className="toast-anim pointer-events-auto flex items-center gap-2.5 bg-primary text-customBg px-5 py-3 rounded-full shadow-lg max-w-[90vw]"
          >
            <CheckCircle2 size={18} className="text-accent shrink-0" />
            <span className="text-sm font-medium">{toast.message}</span>
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

      <h2 className="font-heading text-2xl font-bold text-darkText mb-6">
        {editingId ? "تعديل العرض" : "إضافة عرض جديد"}
      </h2>

      {/* الفورم */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-secondary/30 rounded-2xl p-5 flex flex-col gap-4 mb-10"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-darkText">
            الشارة (Badge)
          </label>
          <input
            name="badge"
            value={form.badge}
            onChange={handleChange}
            required
            placeholder="مثال: خصم 20%"
            className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-darkText">
            عنوان العرض
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="أدخل عنوان العرض"
            className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-darkText">الوصف</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            placeholder="وصف مختصر عن المنتج..."
            className="rounded-lg border border-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary text-darkText resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-darkText">
            رابط الصورة الرئيسية
          </label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            required
            placeholder="url للصورة (مثال: https://...)"
            className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
          />
        </div>

        {/*  صور التفاصيل  */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-darkText">
              صور التفاصيل (اختياري)
            </label>
            <button
              type="button"
              onClick={addImageField}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition"
            >
              <Plus size={14} />
              إضافة صورة
            </button>
          </div>

          {form.images.length === 0 ? (
            <p className="text-xs text-darkText/50">
              لا توجد صور تفاصيل مضافة. دوس "إضافة صورة" لإضافة واحدة.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {form.images.map((imgUrl, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={imgUrl}
                    onChange={(e) =>
                      handleImageFieldChange(index, e.target.value)
                    }
                    placeholder={`url صورة التفاصيل ${index + 1}`}
                    className="flex-1 h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    aria-label="حذف الصورة"
                    className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-darkText">
              السعر قبل الخصم
            </label>
            <input
              name="oldPrice"
              value={form.oldPrice}
              onChange={handleChange}
              required
              type="number"
              className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-darkText">
              السعر بعد الخصم
            </label>
            <input
              name="newPrice"
              value={form.newPrice}
              onChange={handleChange}
              type="number"
              className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-darkText">
            ترتيب الظهور (اختياري)
          </label>
          <input
            name="order"
            value={form.order}
            onChange={handleChange}
            type="number"
            placeholder="1 يظهر الأول، 2 بعده وهكذا...    "
            className="h-11 rounded-lg border border-secondary/40 px-3 text-sm outline-none focus:border-primary text-darkText"
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="submit"
            className="h-11 px-6 rounded-full bg-primary text-customBg font-bold text-sm hover:opacity-90 transition"
          >
            {editingId ? "حفظ التعديلات" : "إضافة العرض"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-11 px-6 rounded-full border border-secondary/50 text-darkText font-medium text-sm hover:bg-secondary/10 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      <h2 className="font-heading text-xl font-bold text-darkText mb-4">
        العروض الحالية (بترتيب الظهور)
      </h2>

      {loading ? (
        <p className="text-sm text-darkText/60">جاري التحميل...</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-darkText/60">لا توجد عروض مضافة بعد.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedOffers.map((offer, i) => {
            const index = startIndex + i;
            const detailImagesCount = Array.isArray(offer.images)
              ? offer.images.length
              : 0;
            return (
              <div
                key={offer.id}
                className="flex items-center gap-3 bg-white border border-secondary/30 rounded-xl p-3"
              >
                {/* أسهم الترتيب */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => moveOffer(index, "up")}
                    disabled={index === 0}
                    aria-label="تحريك لأعلى"
                    className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveOffer(index, "down")}
                    disabled={index === offers.length - 1}
                    aria-label="تحريك لأسفل"
                    className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <span className="w-6 text-center text-xs font-bold text-secondary shrink-0">
                  {index + 1}
                </span>

                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-14 h-14 rounded-lg object-contain bg-secondary/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-darkText truncate">
                    {offer.title}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    {offer.newPrice ? (
                      <>
                        {offer.newPrice} ج.م
                        <span className="line-through text-darkText/40 mr-2">
                          {offer.oldPrice} ج.م
                        </span>
                      </>
                    ) : (
                      <>{offer.oldPrice} ج.م</>
                    )}
                  </p>
                  {detailImagesCount > 0 && (
                    <p className="flex items-center gap-1 text-[11px] text-darkText/50 mt-1">
                      <Images size={12} />
                      {detailImagesCount} صور
                    </p>
                  )}{" "}
                  {detailImagesCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-nowrap overflow-x-auto pb-1">
                      {offer.images.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`${offer.title} ${idx + 1}`}
                          className="w-10 h-10 rounded-md object-cover bg-secondary/10 border border-secondary/30 shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => startEdit(offer)}
                  aria-label="تعديل"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition shrink-0"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(offer)}
                  aria-label="حذف"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="الصفحة السابقة"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                      page === currentPage
                        ? "bg-primary text-customBg"
                        : "bg-secondary/15 text-darkText hover:bg-secondary/25"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="الصفحة التالية"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary/15 text-primary hover:bg-secondary/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal تأكيد الحذف */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-3 left-3 text-darkText/50 hover:text-darkText"
            >
              <X size={18} />
            </button>
            <h3 className="font-heading text-lg font-bold text-darkText mb-2">
              تأكيد الحذف
            </h3>
            <p className="text-sm text-darkText/70 mb-6">
              متأكد إنك عايز تحذف عرض{" "}
              <span className="font-bold text-darkText">
                "{deleteTarget.title}"
              </span>
              ؟ الإجراء ده مش هينفع يترجع فيه.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-full bg-red-600 text-white font-bold text-sm hover:opacity-90 transition"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-11 rounded-full border border-secondary/50 text-darkText font-medium text-sm hover:bg-secondary/10 transition"
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
