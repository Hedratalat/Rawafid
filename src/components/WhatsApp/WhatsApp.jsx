import { FaWhatsapp } from "react-icons/fa";

export default function WhatsApp() {
  const phoneNumber = "201XXXXXXXXX";

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${phoneNumber}`, "_blank");
  };

  return (
    <button
      onClick={handleWhatsApp}
      aria-label="Contact us on WhatsApp"
      className="bg-green-700 text-white rounded-full w-12 h-12 flex items-center justify-center fixed md:right-7 right-3 bottom-4 z-50 hover:bg-green-600 transition-colors shadow-lg"
    >
      <FaWhatsapp className="w-7 h-7" />
    </button>
  );
}
