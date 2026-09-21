import HeroSection from "../components/HeroSection/HeroSection";
import Navbar from "../components/Navbar/Navbar";
import NewArrivle from "../components/NewArrivle/NewArrivle";
import Offers from "../components/Offers/Offers";
import BestSellers from "../components/BestSellers/BestSellers";
import Feedback from "../components/Feedback/Feedback";
import ContactUs from "../components/ContactUs.jsx/ContactUs";
import Footer from "../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Offers />
      <NewArrivle />
      <BestSellers />
      <Feedback />
      <ContactUs />
      <Footer />
    </>
  );
}
