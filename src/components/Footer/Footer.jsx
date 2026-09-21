import { useState, useEffect } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const QUICK_LINKS = [
  { label: "الرئيسية", href: "/" },
  { label: "منتجاتنا", href: "/products" },
  { label: "العروض", href: "/products?category=offers" },
  { label: "العسل", href: "/products?category=عسل" },
  { label: "تواصل معنا", href: "/#contact" },
];

const CONTACTS = [
  { icon: Phone, text: "01000000000", href: "tel:01000000000", dir: "ltr" },
  {
    icon: Mail,
    text: "info@rawafid.com",
    href: "mailto:info@rawafid.com",
    dir: "ltr",
  },
  { icon: MapPin, text: "أسيوط، مصر", href: null },
];

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 22v-8.2h2.8l.5-3.4h-3.3V8.3c0-1 .3-1.7 1.7-1.7H17V3.5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.7H7.5v3.4h2.8V22h3.2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.5z" />
    </svg>
  );
}

const SOCIALS = [
  { label: "فيسبوك", href: "#", icon: FacebookIcon },
  { label: "انستجرام", href: "#", icon: InstagramIcon },
  { label: "واتساب", href: "#", icon: WhatsappIcon },
];

export default function Footer() {
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
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <footer dir="rtl" className="bg-primary text-customBg">
      <style>{`
        @keyframes footerFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .footer-fade-up { animation: footerFadeUp 0.7s ease-out both; }
      `}</style>

      <div
        ref={setNode}
        className={`max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 ${
          visible ? "footer-fade-up" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* عن المتجر */}
          <div className="flex flex-col gap-4">
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
            <p className="text-base leading-8 text-customBg/70 max-w-sm">
              متجر روافد، منتجات مختارة بعناية وبجودة تستحق ثقتكم، توصلكم لحد
              باب البيت.
            </p>
            <div className="flex items-center gap-2 mt-1">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-11 h-11 rounded-full border border-secondary/40 flex items-center justify-center text-customBg hover:bg-accent hover:text-primary hover:border-accent transition"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3 className="font-heading text-xl font-bold text-accent mb-4">
              روابط سريعة
            </h3>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-base text-customBg/80 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* تواصل معنا */}
          <div>
            <h3 className="font-heading text-xl font-bold text-accent mb-4">
              تواصل معنا
            </h3>
            <ul className="flex flex-col gap-3">
              {CONTACTS.map(({ icon: Icon, text, href, dir }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 text-accent">
                    <Icon size={18} />
                  </span>
                  {href ? (
                    <a
                      href={href}
                      dir={dir}
                      className="text-base text-customBg/80 hover:text-accent transition-colors"
                    >
                      {text}
                    </a>
                  ) : (
                    <span className="text-base text-customBg/80">{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-secondary/30 flex flex-col-reverse sm:flex-row items-center justify-between gap-2 text-sm text-customBg/60">
          جميع الحقوق محفوظة، روافد {new Date().getFullYear()} ©
          <p>صُنع بحب في مصر</p>
        </div>
      </div>
    </footer>
  );
}
