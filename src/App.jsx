import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";

import Wishlist from "./pages/Wishlist";
import Addresses from "./pages/Addresses";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* =========================
            CUSTOMER WEBSITE
        ========================= */}

        <Route path="/" element={<Home />} />

        {/* Shop */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:category" element={<Shop />} />
        <Route
          path="/shop/:category/:subCategory"
          element={<Shop />}
        />

        {/* Product */}
        <Route
          path="/product/:slug"
          element={<ProductDetails />}
        />

        {/* Cart */}
        <Route path="/cart" element={<Cart />} />

        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Basic Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Account */}
        <Route path="/account" element={<Account />} />
        <Route path="/account/orders" element={<MyOrders />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account/wishlist" element={<Wishlist />} />
        <Route path="/addresses" element={<Addresses />} />
        <Route path="/account/addresses" element={<Addresses />} />
<Route
  path="/account/orders/:orderId"
  element={<OrderDetails />}
/>

        {/* Customer Authentication */}
        <Route path="/login" element={<Auth />} />
        <Route
          path="/register"
          element={<Auth register />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Protected Admin Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
    path="/admin/products"
    element={<AdminProducts />}
  />
  <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        {/* =========================
            404
        ========================= */}

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </>
  );
}