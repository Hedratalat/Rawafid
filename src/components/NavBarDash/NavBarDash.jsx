import { FiLogOut } from "react-icons/fi";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

export default function NavBarDash({ onMenuClick }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:");
    }
  };

  return (
    <nav className="bg-primary text-white z-40 shadow-md border-b border-secondary">
      <div className="flex items-center px-4 sm:px-6 h-16 sm:h-20">
        {/* زر القائمة للموبايل */}
        <button
          onClick={onMenuClick}
          className="lg:hidden bg-primary/70 p-2 ml-2 rounded-md hover:bg-accent transition text-customBg"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg sm:text-2xl font-sans font-semibold text-customBg">
          مرحبا بك
        </h2>
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="mr-auto flex items-center gap-2
   bg-accent text-customBg px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-lg
    hover:bg-accent/85 transition"
        >
          تسجيل الخروج <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </nav>
  );
}
