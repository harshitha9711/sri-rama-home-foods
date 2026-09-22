import { MapPin, Phone, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "";

function ContactItem({ icon, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-green/10 text-brand-green">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-black/40">
          {title}
        </p>

        <div className="mt-1 text-sm font-bold text-black/80">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">
            Contact
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Get in touch with
            <span className="block text-brand-green">
              Sri Rama Home Foods
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-black/55">
            Contact us for product enquiries and orders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.75rem] bg-white p-7 ring-1 ring-black/5 sm:p-9">
            <h2 className="text-2xl font-black">
              Contact Information
            </h2>

            <div className="mt-8 space-y-7">
              <ContactItem
                icon={<Phone size={19} />}
                title="Phone"
              >
                <div className="space-y-1">
                  <a
                    href="tel:9502911062"
                    className="block hover:text-brand-green"
                  >
                    9502911062
                  </a>

                  <a
                    href="tel:9948584971"
                    className="block hover:text-brand-green"
                  >
                    9948584971
                  </a>
                </div>
              </ContactItem>

              <ContactItem
                icon={<MapPin size={19} />}
                title="Address"
              >
                Near More Mart,
                <br />
                Mahabubabad,
                <br />
                Telangana - 506101
              </ContactItem>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-brand-green p-7 text-white sm:p-9">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">
              Orders
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Order through WhatsApp
            </h2>

            <p className="mt-4 text-sm leading-6 text-white/75">
              Select your products, add your delivery address and place your
              order through WhatsApp. Payment can then be made using the
              provided UPI/QR code.
            </p>

            {WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-brand-green transition hover:-translate-y-0.5"
              >
                <MessageCircle size={17} />
                WHATSAPP US
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}