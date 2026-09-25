import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function CartToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;

    function handleToast(event) {
      setMessage(
        event.detail?.message ||
          "Added to cart"
      );

      setVisible(true);

      clearTimeout(timer);

      timer = setTimeout(() => {
        setVisible(false);
      }, 2200);
    }

    window.addEventListener(
      "homefoods-toast",
      handleToast
    );

    return () => {
      window.removeEventListener(
        "homefoods-toast",
        handleToast
      );

      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-5 z-[9999] w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl">
        <CheckCircle2
          size={22}
          className="shrink-0 text-green-600"
        />

        <span className="flex-1 text-sm font-semibold text-black">
          {message}
        </span>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-black/40 hover:text-black"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}