import tailwindRtl from "tailwindcss-rtl";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A3B23", // الشريط العلوي، الفوتر، والعناوين الرئيسية الكبيرة
        secondary: "#D4A373", // حدود الكروت، خلفيات القسم الفرعي، تمييز عناصر بسيطة
        customBg: "#FDFBF7", // خلفية عامة لكل صفحات الموقع
        accent: "#D9A22A", // زرار "أضف للسلة"، التقييمات بالنجوم، الأيقونات المميزة
        darkText: "#1A1A1A", // نص الفقرات والعناوين الفرعية
      },
      fontFamily: {
        heading: ["El Messiri", "sans-serif"], // للعناوي
        body: ["Tajawal", "sans-serif"], // للنصوص العادية
      },
    },
  },
  plugins: [tailwindRtl],
};
