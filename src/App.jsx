import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartToast from "./components/CartToast";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Categories from "./pages/Categories";

import Wishlist from "./pages/Wishlist";

import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";

export default function App() {
  return (
    <>
      <CartToast />

      <Navbar />

      <Routes>
        {/* =========================
            CUSTOMER WEBSITE
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/shop" element={<Shop />} />

        <Route
          path="/shop/:category"
          element={<Shop />}
        />

        <Route
          path="/shop/:category/:subCategory"
          element={<Shop />}
        />
        <Route
  path="/categories"
  element={<Categories />}
/>
        <Route
          path="/product/:slug"
          element={<ProductDetails />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route element={<AdminProtectedRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/products"
            element={<AdminProducts />}
          />
<Route
  path="/admin/categories"
  element={<AdminCategories />}
/>
          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />
        </Route>

        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <Footer />
    </>
  );
}