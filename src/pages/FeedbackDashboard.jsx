import { useState, useEffect } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Star, Trash2, X, CheckCircle2, Check, XCircle } from "lucide-react";

const COLLECTION_NAME = "Feedback";

export default function FeedbackDashboard() {
  const [feedbackList, setFeedbackList] = useState([]);
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
    const unsub = onSnapshot(q, (snapshot) => {
      setFeedbackList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function toggleApproved(item) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, item.id), {
        approved: !item.approved,
      });
      showToast(item.approved ? "تم إخفاء الرأي" : "تم نشر الرأي");
    } catch (err) {
      console.error("Error updating feedback:", err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, deleteTarget.id));
      showToast("تم حذف الرأي بنجاح");
    } catch (err) {
      console.error("Error deleting feedback:", err);
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-darkText">
          إدارة آراء العملاء
        </h2>
        {feedbackList.length > 0 && (
          <span className="text-xs text-darkText/50">
            {feedbackList.length} آراء
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-darkText/60">جاري التحميل...</p>
      ) : feedbackList.length === 0 ? (
        <p className="text-sm text-darkText/60">لا توجد آراء بعد.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {feedbackList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-secondary/30 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-darkText truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={
                          i < item.rating
                            ? "fill-accent text-accent"
                            : "text-secondary/30"
                        }
                      />
                    ))}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    item.approved
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/15 text-secondary"
                  }`}
                >
                  {item.approved ? "منشور" : "قيد المراجعة"}
                </span>
              </div>

              <p className="text-sm text-darkText/70 leading-6">
                {item.message}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => toggleApproved(item)}
                  className={`flex-1 h-10 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    item.approved
                      ? "border border-secondary/40 text-darkText hover:bg-secondary/10"
                      : "bg-primary text-customBg hover:opacity-90"
                  }`}
                >
                  {item.approved ? (
                    <>
                      <XCircle size={14} />
                      إخفاء الرأي
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      نشر الرأي
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteTarget(item)}
                  aria-label="حذف"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
            <h3 className="font-heading text-lg font-bold text-darkText mb-2">
              تأكيد الحذف
            </h3>
            <p className="text-sm text-darkText/70 mb-6">
              متأكد إنك عايز تحذف رأي{" "}
              <span className="font-bold text-darkText">
                "{deleteTarget.name}"
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
