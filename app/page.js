"use client";

import { useEffect, useMemo, useState } from "react";
import MapPicker from "@/components/MapPicker";
import { isValidGeorgianMobile } from "@/lib/phone";

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h1.2a1 1 0 0 1 .96.73l1.02 3.57a1 1 0 0 1-.29.99l-1.04.96a12.5 12.5 0 0 0 5.9 5.9l.96-1.04a1 1 0 0 1 .99-.29l3.57 1.02a1 1 0 0 1 .73.96V18a2 2 0 0 1-2 2h-.5C10.49 20 4 13.51 4 5.5V5Z" fill="currentColor"/>
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden {...props}>
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm1-10.59V7a1 1 0 1 0-2 0v5a1 1 0 0 0 .29.71l3 3a1 1 0 1 0 1.42-1.42L13 11.41Z" fill="currentColor"/>
    </svg>
  );
}

function StarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden {...props}>
      <path d="M11.48 2.5a.6.6 0 0 1 1.04 0l2.47 4.73 5.24.76a.6.6 0 0 1 .33 1.02l-3.79 3.7.9 5.22a.6.6 0 0 1-.87.63L12 16.91l-4.69 2.46a.6.6 0 0 1-.87-.63l.9-5.22-3.79-3.7a.6.6 0 0 1 .33-1.02l5.24-.76 2.48-4.73Z"/>
    </svg>
  );
}

function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden {...props}>
      <path d="M3 4h1.4a1 1 0 0 1 .97.76L7 12.5a2 2 0 0 0 1.95 1.5H17a2 2 0 0 0 1.94-1.49l1.34-5.02A1 1 0 0 0 19.34 6H6.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function ProductCard({ product, onAdd }) {
  const [size, setSize] = useState(product.sizes?.[0]?.sizeKg ?? 0.5);
  const selected = product.sizes.find((s) => s.sizeKg === size) || product.sizes[0];
  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-200 via-amber-100 to-white" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="text-lg font-semibold leading-tight">{product.name}</div>
        <div className="text-sm text-black/60 line-clamp-2">{product.description}</div>
        <div className="flex items-center gap-2 mt-1">
          {product.sizes.map((s) => (
            <button
              key={s.sizeKg}
              onClick={() => setSize(s.sizeKg)}
              className={`px-3 py-1 rounded-full border text-sm ${size === s.sizeKg ? "bg-black text-white border-black" : "hover:bg-black/5"}`}
            >
              {s.sizeKg === 0.5 ? "Small" : "Large"} · {s.sizeKg}kg · {s.price.toFixed(0)} ₾
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <button onClick={() => onAdd(product.id, selected.sizeKg)} className="w-full justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">
            <CartIcon /> Add to Cart — {selected.price.toFixed(0)} ₾
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {productId, sizeKg, quantity}
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  function addToCart(productId, sizeKg) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId && i.sizeKg === sizeKg);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId, sizeKg, quantity: 1 }];
    });
  }

  function changeQty(productId, sizeKg, qty) {
    setCart((prev) => prev.map((i) => i.productId === productId && i.sizeKg === sizeKg ? { ...i, quantity: Math.max(1, qty) } : i));
  }

  function removeLine(productId, sizeKg) {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.sizeKg === sizeKg)));
  }

  const detailedCart = useMemo(() => {
    return cart.map((line) => {
      const p = products.find((x) => x.id === line.productId);
      const s = p?.sizes.find((z) => z.sizeKg === line.sizeKg);
      return {
        ...line,
        name: p?.name || "",
        unitPrice: s?.price || 0,
        lineTotal: (s?.price || 0) * line.quantity
      };
    });
  }, [cart, products]);

  const total = useMemo(() => detailedCart.reduce((sum, i) => sum + i.lineTotal, 0), [detailedCart]);

  async function submitOrder() {
    setMessage(null);
    if (!firstName || !lastName) {
      setMessage({ type: "error", text: "Enter your name and surname" });
      return;
    }
    if (!isValidGeorgianMobile(phone)) {
      setMessage({ type: "error", text: "Enter valid Georgian mobile (+995 5XX XX XX XX)" });
      return;
    }
    if (!addressText && !location) {
      setMessage({ type: "error", text: "Provide address or choose on map" });
      return;
    }
    if (cart.length === 0) {
      setMessage({ type: "error", text: "Add at least one item" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, addressText, location, items: cart })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create order");
      // Prepare summary for SMS API usage
      const smsText = `${firstName} ${lastName} | ${phone} | ${addressText || "map"} | ` +
        detailedCart.map((i) => `${i.name} ${i.sizeKg}kg x${i.quantity}`).join(", ") +
        ` | Total: ${total.toFixed(2)} GEL`;
      console.log("SMS Payload:", smsText);
      setMessage({ type: "success", text: "Order placed! We'll contact you shortly." });
      setCart([]);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-white to-amber-50">
      <div className="sticky top-0 z-30 border-b backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-rose-600" />
            <div className="font-semibold">Khinkalito</div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-black/70">
            <div className="flex items-center gap-2"><PhoneIcon /> +995 555 123 456</div>
            <div className="flex items-center gap-2"><ClockIcon /> Open Daily 11:00 - 23:00</div>
            <a href="/admin" className="underline">Admin</a>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700">
            <CartIcon /> Cart
            {detailedCart.length > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white text-rose-700 text-xs font-semibold">{detailedCart.length}</span>
            ) : null}
          </button>
        </div>
      </div>

      <section className="relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black">Authentic Georgian Khinkali</h1>
            <p className="mt-4 text-lg text-black/70">Handmade dumplings delivered fresh to your door</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border"><StarIcon className="text-amber-500"/> 4.9 Rating</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border">500+ Happy Customers</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border">30-45 min Delivery</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">Traditional Georgian Cuisine</h2>
          <p className="mt-3 text-black/70">At Khinkalito, we bring you the authentic taste of Georgia through our handmade khinkali. Each dumpling is carefully crafted using traditional recipes passed down through generations.</p>
          <div className="mt-3 text-sm text-black/60">Delivering across Tbilisi</div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <h3 className="text-2xl font-bold text-center">Our Khinkali Menu</h3>
        <p className="text-center text-black/70 mt-1">Choose from our selection of traditional Georgian dumplings</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white p-5 md:p-6 flex flex-col gap-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border rounded-lg px-3 py-2" />
              <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border rounded-lg px-3 py-2" />
            </div>
            <input placeholder="Mobile (+995 5XX XX XX XX)" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-lg px-3 py-2" />
            <h4 className="text-lg font-semibold mt-2">Address</h4>
            <textarea placeholder="Enter address details" value={addressText} onChange={(e) => setAddressText(e.target.value)} className="border rounded-lg px-3 py-2 min-h-[90px]" />
            <div className="flex justify-end mt-1">
              <button disabled={submitting} onClick={submitOrder} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50">
                <CartIcon /> {submitting ? "Placing..." : "Place Order"}
              </button>
            </div>
            {message ? (
              <div className={`p-3 rounded-lg ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message.text}</div>
            ) : null}
          </div>
          <div className="rounded-2xl border bg-white p-2">
            <MapPicker value={location} onChange={setLocation} onAddress={setAddressText} height={360} />
            <div className="text-xs text-black/60 mt-2 px-2">Click on the map to set delivery location (optional if address text provided).</div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold">Khinkalito</div>
            <p className="text-black/70 mt-2">Authentic Georgian khinkali delivered fresh to your door.</p>
            <p className="text-black/60 mt-1">Traditional recipes, modern convenience.</p>
          </div>
          <div>
            <div className="font-semibold">Contact</div>
            <div className="mt-2 flex items-center gap-2 text-black/70"><PhoneIcon /> +995 555 123 456</div>
            <div className="mt-1 text-black/60">Tbilisi, Georgia</div>
          </div>
          <div>
            <div className="font-semibold">Hours</div>
            <div className="mt-2 text-black/70">Monday - Sunday</div>
            <div className="text-black/70">11:00 AM - 11:00 PM</div>
            <div className="text-green-600 font-medium mt-1">Open Now</div>
          </div>
        </div>
        <div className="text-center text-xs text-black/50 pb-6">© {new Date().getFullYear()} Khinkalito. All rights reserved.</div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Your Cart</div>
              <button className="text-sm" onClick={() => setCartOpen(false)}>Close</button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
              {detailedCart.length === 0 ? (
                <div className="text-sm text-black/60">Your cart is empty.</div>
              ) : (
                detailedCart.map((i) => (
                  <div key={`${i.productId}-${i.sizeKg}`} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-black/60">{i.sizeKg} kg · {i.unitPrice.toFixed(2)} ₾</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={i.quantity} onChange={(e) => changeQty(i.productId, i.sizeKg, Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                      <div className="w-24 text-right">{i.lineTotal.toFixed(2)} ₾</div>
                      <button onClick={() => removeLine(i.productId, i.sizeKg)} className="text-sm text-red-600">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Total</div>
                <div className="font-semibold">{total.toFixed(2)} ₾</div>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-full px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">Continue to details</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
