import { useState, useEffect } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Trash2, X, CheckCircle2, Mail, Phone, Clock } from "lucide-react";

const COLLECTION_NAME = "Messages";

function formatDate(createdAt) {
  if (!createdAt?.toDate) return "";
  return createdAt.toDate().toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageDashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading messages:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, deleteTarget.id));
      showToast("تم حذف الرسالة بنجاح");
    } catch (err) {
      console.error("Error deleting message:", err);
      showToast("حصل خطأ أثناء الحذف، حاول تاني");
    } finally {
      setDeleteTarget(null);
    }
  }

  // بنقرا fullName (الفورم الجديد) وبنرجع لـ name للرسائل القديمة
  const getName = (item) => item.fullName || item.name || "بدون اسم";

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

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-3xl font-bold text-darkText">
          إدارة الرسائل
        </h2>
        {messages.length > 0 && (
          <span className="text-sm text-darkText/50">
            {messages.length} رسائل
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-base text-darkText/60">جاري التحميل...</p>
      ) : messages.length === 0 ? (
        <p className="text-base text-darkText/60">لا توجد رسائل بعد.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-secondary/30 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-darkText truncate">
                    {getName(item)}
                  </p>
                  {formatDate(item.createdAt) && (
                    <p className="flex items-center gap-1 mt-1 text-xs text-darkText/50">
                      <Clock size={13} />
                      {formatDate(item.createdAt)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setDeleteTarget(item)}
                  aria-label="حذف"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {(item.email || item.phone) && (
                <div className="flex flex-wrap items-center gap-2">
                  {item.email && (
                    <a
                      href={`mailto:${item.email}`}
                      className="flex items-center gap-1.5 text-sm text-darkText/70 bg-secondary/10 hover:bg-secondary/20 transition px-3 py-1.5 rounded-full"
                    >
                      <Mail size={15} className="text-primary shrink-0" />
                      <span className="break-all">{item.email}</span>
                    </a>
                  )}
                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="flex items-center gap-1.5 text-sm text-darkText/70 bg-secondary/10 hover:bg-secondary/20 transition px-3 py-1.5 rounded-full"
                    >
                      <Phone size={15} className="text-primary shrink-0" />
                      <span dir="ltr">{item.phone}</span>
                    </a>
                  )}
                </div>
              )}

              <p className="text-base text-darkText/70 leading-7 whitespace-pre-wrap break-words">
                {item.message}
              </p>
            </div>
          ))}
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
            <h3 className="font-heading text-xl font-bold text-darkText mb-2">
              تأكيد الحذف
            </h3>
            <p className="text-base text-darkText/70 mb-6">
              متأكد إنك عايز تحذف رسالة{" "}
              <span className="font-bold text-darkText">
                "{getName(deleteTarget)}"
              </span>
              ؟ الإجراء ده مش هينفع يترجع فيه.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-full bg-red-600 text-white font-bold text-base hover:opacity-90 transition"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-11 rounded-full border border-secondary/50 text-darkText font-medium text-base hover:bg-secondary/10 transition"
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
