import "./App.css";
import Home from "./pages/Home";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import DashBoardLayout from "./components/DashboardLayout/DashboardLayout";
import HeroDashboard from "./pages/HeroDashboard";
import OfferDashboard from "./pages/OfferDashboard";
import ProductsManagement from "./pages/ProductsManagement";
import FeedbackDashboard from "./pages/FeedbackDashboard";
import MessageDashboard from "./pages/MessageDashboard";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/dashboard"
          element={
            // <ProtectedRoute>
            <DashBoardLayout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="heroSection" replace />} />
          <Route path="heroSection" element={<HeroDashboard />} />
          <Route path="offerSection" element={<OfferDashboard />} />
          <Route path="productsManagement" element={<ProductsManagement />} />
          <Route path="feedback" element={<FeedbackDashboard />} />
          <Route path="message" element={<MessageDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
