import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Auth({ register: isRegister = false }) {
  const navigate = useNavigate();

  const {
    login,
    register,
    isAuthenticated,
  } = useAuth();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/account", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister) {
      // NAME
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }

      // At least ONE of email or phone is required.
      // Neither is individually mandatory.
      if (!email.trim() && !phone.trim()) {
        setError("Please enter either your email or phone number.");
        return;
      }

      // Email is optional, but if entered it must be valid.
      if (
        email.trim() &&
        !/^\S+@\S+\.\S+$/.test(email.trim())
      ) {
        setError("Please enter a valid email address.");
        return;
      }

      // Phone is optional, but if entered it must be valid.
      if (
        phone.trim() &&
        !/^\d{10}$/.test(phone.trim())
      ) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      // PASSWORD
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      // CONFIRM PASSWORD
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else {
      // LOGIN
      if (!identifier.trim()) {
        setError("Please enter your email or phone number.");
        return;
      }

      if (!password) {
        setError("Please enter your password.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isRegister) {
        await register({
          name: name.trim(),

          // Empty email/phone will be sent as empty string.
          // Backend can handle whichever one the customer provides.
          email: email.trim(),
          phone: phone.trim(),

          password,
        });
      } else {
        await login(identifier.trim(), password);
      }

      navigate("/account", {
        replace: true,
      });
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[75vh] bg-brand-cream px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">

          {/* HEADER */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-green text-2xl text-white">
              🏡
            </div>

            <h1 className="text-2xl font-extrabold text-brand-green">
              {isRegister
                ? "Create Account"
                : "Welcome Back"}
            </h1>

            <p className="mt-2 text-sm text-black/60">
              {isRegister
                ? "Create your Home Foods account"
                : "Login to your Home Foods account"}
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAME */}
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
                />
              </div>
            )}

            {/* REGISTER: EMAIL + PHONE */}
            {isRegister ? (
              <>
                {/* EMAIL - OPTIONAL */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Email
                    <span className="ml-1 text-xs font-normal text-black/40">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
                  />
                </div>

                {/* PHONE - OPTIONAL */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">
                    Phone
                    <span className="ml-1 text-xs font-normal text-black/40">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      )
                    }
                    placeholder="10-digit phone number"
                    maxLength={10}
                    autoComplete="tel"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
                  />
                </div>

                {/* INFO */}
                <p className="text-xs leading-5 text-black/45">
                  Enter either your email or phone number. You do not need
                  to provide both.
                </p>
              </>
            ) : (
              /* LOGIN IDENTIFIER */
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Email or Phone
                </label>

                <input
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder="Enter email or phone"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
                />
              </div>
            )}

            {/* PASSWORD */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete={
                  isRegister
                    ? "new-password"
                    : "current-password"
                }
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand-green"
                />
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-green px-4 py-3 font-bold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isRegister
                  ? "Creating Account..."
                  : "Logging In..."
                : isRegister
                ? "Create Account"
                : "Login"}
            </button>
          </form>

          {/* SWITCH LOGIN / REGISTER */}
          <div className="mt-6 text-center text-sm text-black/60">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-brand-green"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-brand-green"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}