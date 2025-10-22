"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {useTranslations, useLocale} from "next-intl";
import dynamic from "next/dynamic";
import { isValidGeorgianMobile, formatGeorgianMobileInput } from "@/lib/phone";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-500 animate-spin" aria-label="Loading map" />
    </div>
  ),
});

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h1.2a1 1 0 0 1 .96.73l1.02 3.57a1 1 0 0 1-.29.99l-1.04.96a12.5 12.5 0 0 0 5.9 5.9l.96-1.04a1 1 0 0 1 .99-.29l3.57 1.02a1 1 0 0 1 .73.96V18a2 2 0 0 1-2 2h-.5C10.49 20 4 13.51 4 5.5V5Z" fill="currentColor"/>
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7H3V7Zm12 2h2.586a2 2 0 0 1 1.414.586L21.414 12A2 2 0 0 1 22 13.414V16a2 2 0 0 1-2 2h-1" fill="currentColor"/>
      <path d="M7.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor"/>
    </svg>
  );
}

 

function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M3 4h1.4a1 1 0 0 1 .97.76L7 12.5a2 2 0 0 0 1.95 1.5H17a2 2 0 0 0 1.94-1.49l1.34-5.02A1 1 0 0 0 19.34 6H6.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function LocationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
}

function LineSkeleton({ width = "w-24", className = "" }) {
  return <div className={`h-4 ${width} bg-gray-200 animate-pulse rounded ${className}`} />;
}

function InlineSkeleton({ width = "w-16", className = "" }) {
  return <span className={`inline-block align-middle bg-gray-200 animate-pulse rounded h-3 ${width} ${className}`} />;
}

function getProductName(product, locale) {
  const n = product?.name;
  if (n && typeof n === "object") {
    return n[locale] || n.en || n.ka || "";
  }
  return n || "";
}

function getProductDescription(product, locale) {
  const d = product?.description;
  if (d && typeof d === "object") {
    return d[locale] || d.en || d.ka || "";
  }
  return d || "";
}

function ProductCard({ product, onAdd, t }) {
  const locale = useLocale();
  const [size, setSize] = useState(product.sizes?.[0]?.sizeKg ?? 0.5);
  const selected = product.sizes.find((s) => s.sizeKg === size) || product.sizes[0];
  
  return (
    <div className="card animate-fade-in group h-full flex flex-col">
      <div className="relative h-44 md:h-64 bg-gradient-to-br from-red-50 via-amber-50 to-orange-50 overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={getProductName(product, locale)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        {/* Removed wishlist heart icon */}
        {/* Removed rating/time overlay from product cards */}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{getProductName(product, locale)}</h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{getProductDescription(product, locale)}</p>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="text-sm font-medium text-gray-700">Size Options:</div>
          <div className="flex gap-3 md:gap-10">
            {product.sizes.map((s) => (
              <button
                key={s.sizeKg}
                onClick={() => setSize(s.sizeKg)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  size === s.sizeKg 
                    ? "size-option--active transform scale-105" 
                    : "size-option"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-3 w-full">
                  <span className="text-[10px] md:text-xs opacity-70 md:opacity-80">{s.sizeKg === 0.5 ? "Small" : "Large"}</span>
                  <span className="font-semibold text-xs md:text-sm">{s.sizeKg}kg</span>
                  <span className="text-[10px] md:text-xs">{s.price.toFixed(0)} ₾</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            onClick={() => onAdd(product.id, selected.sizeKg)} 
            className="btn-primary w-full justify-center text-xs md:text-base font-semibold py-2.5 md:py-3 hover:scale-105 transition-transform duration-200"
          >
            <CartIcon />
            <span className="text-2xs md:text-base">{t("common.cart")} {selected.price.toFixed(0)}₾</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {productId, sizeKg, quantity}
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [lastAddressUpdateFromMap, setLastAddressUpdateFromMap] = useState(false);
  const [settings, setSettings] = useState(null);
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const geocodeTimeoutRef = useRef(null);
  const geocodeSeqRef = useRef(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [year, setYear] = useState(null);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  useEffect(() => {
    setHeroLoaded(false);
  }, [settings?.heroImage]);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // Payment iframe return listener + status polling fallback
  useEffect(() => {
    function onMessage(ev) {
      const data = ev?.data;
      if (data && data.type === "ipay:returned") {
        setPaymentUrl(null);
        setMessage({ type: "success", text: t("success.orderPlaced") });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [t]);

  useEffect(() => {
    if (!paymentUrl || !currentOrderId) return;
    let timer;
    async function poll() {
      try {
        const r = await fetch(`/api/orders/status?id=${encodeURIComponent(currentOrderId)}`, { cache: "no-store" });
        const j = await r.json();
        if (j?.status === "paid") {
          setPaymentUrl(null);
          setMessage({ type: "success", text: t("success.orderPlaced") });
          return;
        }
      } catch {}
      timer = setTimeout(poll, 2500);
    }
    timer = setTimeout(poll, 2500);
    return () => clearTimeout(timer);
  }, [paymentUrl, currentOrderId, t]);

  // Debounced geocoding of typed address -> update map pin
  useEffect(() => {
    if (!addressText || lastAddressUpdateFromMap) return;
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    const currentSeq = ++geocodeSeqRef.current;
    const timerId = setTimeout(async () => {
      try {
        const text = addressText.trim();
        if (!text) return;
        if (window?.google?.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ address: text, componentRestrictions: { country: "GE" } });
          const first = result?.results?.[0];
          const loc = first?.geometry?.location;
          if (loc) {
            if (currentSeq === geocodeSeqRef.current) {
              const next = { lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat, lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng };
              setLocation(next);
            }
            return;
          }
        }
        // Fallback to Nominatim forward geocoding
        const q = encodeURIComponent(addressText);
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ge&q=${q}&limit=1`);
        const arr = await r.json();
        const first = Array.isArray(arr) ? arr[0] : null;
        if (first?.lat && first?.lon && currentSeq === geocodeSeqRef.current) {
          setLocation({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
        }
      } catch (_) {
        // ignore
      }
    }, 1200);
    geocodeTimeoutRef.current = timerId;
    return () => clearTimeout(timerId);
  }, [addressText, lastAddressUpdateFromMap]);

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
        name: p ? getProductName(p, locale) : "",
        unitPrice: s?.price || 0,
        lineTotal: (s?.price || 0) * line.quantity
      };
    });
  }, [cart, products]);

  const total = useMemo(() => detailedCart.reduce((sum, i) => sum + i.lineTotal, 0), [detailedCart]);

  async function submitOrder() {
    setMessage(null);
    if (!firstName || !lastName) {
      setMessage({ type: "error", text: t("errors.name") });
      return;
    }
    if (!isValidGeorgianMobile(phone)) {
      setMessage({ type: "error", text: t("errors.phone") });
      return;
    }
    if (!addressText && !location) {
      setMessage({ type: "error", text: t("errors.address") });
      return;
    }
    if (cart.length === 0) {
      setMessage({ type: "error", text: t("errors.emptyCart") });
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
      if (data?.redirectUrl) {
        setPaymentUrl(data.redirectUrl);
      }
      setCurrentOrderId(data?.order?.id || null);
      const smsText = `${firstName} ${lastName} | ${phone} | ${addressText || "map"} | ` +
        detailedCart.map((i) => `${i.name} ${i.sizeKg}kg x${i.quantity}`).join(", ") +
        ` | Total: ${total.toFixed(2)} GEL`;
      console.log("SMS Payload:", smsText);
      setMessage({ type: "success", text: t("success.orderPlaced") });
      setCart([]);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 pt-2">
      {/* Modern Navigation Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-sm py-1 md:py-2">
        <nav className="container mx-auto">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Khinkalito" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-900">{t("common.brand")}</span>
                <span className="text-[11px] md:text-xs text-gray-500 hidden md:block">{t("common.tagline")}</span>
              </div>
            </div>

            {/* Contact Info - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <PhoneIcon className="text-red-600" />
                {settings?.phone ? (
                  <span className="font-medium">{settings.phone}</span>
                ) : (
                  <LineSkeleton width="w-28" />
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <ClockIcon className="text-gray-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t("common.openDaily")}</span>
                  {settings?.hours ? (
                    <span className="text-xs">{settings.hours}</span>
                  ) : (
                    <div className="mt-1"><LineSkeleton width="w-20" /></div>
                  )}
                </div>
              </div>
              {/* Admin link removed to keep admin panel hidden from UI */}
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {/* Cart Button */}
              <button 
                onClick={() => setCartOpen(true)} 
                className="relative btn-primary hover:scale-105 transition-all duration-200"
              >
                <CartIcon />
                <span className="hidden md:inline">{t("common.cart")}</span>
                {detailedCart.length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 md:h-6 md:w-6 bg-amber-400 text-red-800 text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {detailedCart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-4 md:py-6">
        <div className="absolute inset-0">
          {/* Placeholder while loading or when no image set */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          {/* Hero image fades in when loaded; tinted low opacity */}
          {settings?.heroImage && (
            <img
              src={settings.heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: heroLoaded ? 0.15 : 0 }}
              onLoad={() => setHeroLoaded(true)}
            />
          )}
          {/* Overlay tint */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-amber-600/20" />
        </div>
        
        <div className="relative container mx-auto py-12 md:py-24">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                <LocationIcon className="w-4 h-4" />
                {t("common.nowDelivering")}
              </span>
            </div>
            
            {settings?.heroTitle?.[locale] ? (
              <h1 className="text-hero gradient-text mb-4 md:mb-6 text-balance">
                {settings.heroTitle[locale]}
              </h1>
            ) : (
              <div className="mb-4 md:mb-6 flex justify-center">
                <Skeleton className="h-10 w-3/4 md:w-2/3" />
              </div>
            )}
            
            {settings?.heroDesc?.[locale] ? (
              <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
                {settings.heroDesc[locale]}
              </p>
            ) : (
              <div className="mb-6 md:mb-8 max-w-2xl mx-auto">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            
            {/* Stats cards removed as requested */}
            
            <button 
              onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-base md:text-lg px-5 py-3 md:px-8 md:py-4 hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <CartIcon />
              {t("common.orderNow")}
            </button>
          </div>
        </div>
        
        
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {settings?.aboutTitle?.[locale] ? (
              <h2 className="text-section text-gray-900 mb-6">{settings.aboutTitle[locale]}</h2>
            ) : (
              <div className="mb-6 flex justify-center"><Skeleton className="h-8 w-2/3" /></div>
            )}
            {settings?.about1?.[locale] ? (
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                {settings.about1[locale]}
              </p>
            ) : (
              <div className="mb-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {/* Removed secondary about paragraph per request */}
            
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t("home.madeWithLove")}</h3>
                <p className="text-gray-600 text-sm">{t("home.madeWithLoveDesc")}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t("home.freshIngredients")}</h3>
                <p className="text-gray-600 text-sm">{t("home.freshIngredientsDesc")}</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LocationIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{t("home.fastDelivery")}</h3>
                <p className="text-gray-600 text-sm">{t("home.fastDeliveryDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-section text-gray-900 mb-3 md:mb-4">{t("home.menuTitle")}</h2>
            {settings?.menuDesc?.[locale] ? (
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                {settings.menuDesc[locale]}
              </p>
            ) : (
              <div className="max-w-2xl mx-auto">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {products.map((p, index) => (
              <div key={p.id} className="h-full" style={{ animationDelay: `${index * 100}ms` }}>
                <ProductCard product={p} onAdd={addToCart} t={t} />
              </div>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-full">
                  <div className="relative h-44 md:h-64 overflow-hidden rounded-t-xl">
                    <Skeleton className="absolute inset-0" />
                  </div>
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="mt-4">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Order Form Section */}
      <section id="checkout" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-section text-gray-900 mb-3 md:mb-4">{t("home.completeOrderTitle")}</h2>
            {settings?.completeOrderDesc?.[locale] ? (
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                {settings.completeOrderDesc[locale]}
              </p>
            ) : (
              <div className="max-w-2xl mx-auto">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 md:gap-12">
            {/* Order Form */}
            <div className="card card-elevated animate-fade-in">
              <div className="p-5 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{t("home.contactInfo")}</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.firstName")}</label>
                      <input 
                        type="text"
                        placeholder={t("home.firstName")} 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.lastName")}</label>
                      <input 
                        type="text"
                        placeholder={t("home.lastName")} 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="input-field"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.mobilePhone")}</label>
                    <input 
                      type="tel"
                      placeholder="+995 5XX XX XX XX" 
                      value={phone} 
                      onChange={(e) => setPhone(formatGeorgianMobileInput(e.target.value))} 
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">{t("home.deliveryAddress")}</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.addressDetails")}</label>
                    <textarea 
                      placeholder={t("home.addressPlaceholder")} 
                      value={addressText} 
                      onChange={(e) => {
                        setLastAddressUpdateFromMap(false);
                        setAddressText(e.target.value);
                      }} 
                      className="input-field resize-none h-24"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                  {settings?.freeDeliveryThreshold && settings.freeDeliveryThreshold > 0 ? (
                    <span>{t("common.free")} {t("common.delivery")} {t("common.onOrdersOver")} {settings.freeDeliveryThreshold} ₾</span>
                  ) : (
                    <span>{t("home.freeDelivery")}</span>
                  )}
                </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    <span>{t("home.eta")}</span>
                  </div>
                </div>
                
                <button 
                  disabled={submitting || cart.length === 0} 
                  onClick={submitOrder} 
                  className="btn-primary w-full justify-center text-base md:text-lg py-3 md:py-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
                >
                  <CartIcon />
                  {submitting ? t("home.placingOrder") : `${t("home.placeOrder")} • ${total.toFixed(0)} ₾`}
                </button>
                
                {message && (
                  <div className={`mt-4 p-4 rounded-xl ${
                    message.type === "error" 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.type === "error" ? (
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">!</span>
                        </div>
                      ) : (
                        <CheckIcon className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-medium">{message.text}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Map */}
            <div className="card animate-fade-in">
              <div className="p-3 md:p-4 md:h-[520px] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <LocationIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-base md:text-lg font-bold text-gray-900">{t("home.selectLocation")}</h3>
                </div>
                <div className="h-[320px] md:flex-1">
                  <MapPicker 
                    value={location} 
                    onChange={setLocation} 
                    onAddress={(text) => {
                      setLastAddressUpdateFromMap(true);
                      setAddressText(text);
                    }} 
                    height="100%" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-16">
        <div className="container mx-auto py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Khinkalito" className="w-full h-full object-contain rounded-xl bg-white ring-1 ring-white/80 p-0.5" />
                </div>
                <div>
                  <div className="font-bold text-xl">{t("common.brand")}</div>
                  <div className="text-gray-400 text-sm">{t("common.tagline")}</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                {t("home.heroDesc")}
              </p>
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="font-medium">
                  {t("common.openNow")} • {t("common.deliveringUntil")} {" "}
                  {settings?.deliveringUntil ? (
                    `(${settings.deliveringUntil})`
                  ) : (
                    <InlineSkeleton width="w-16" />
                  )}
                </span>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4">{t("common.contact")}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <PhoneIcon className="text-red-400" />
                  {settings?.phone ? <span>{settings.phone}</span> : <LineSkeleton width="w-28" />}
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <LocationIcon className="text-blue-400" />
                  {settings?.address ? <span>{settings.address}</span> : <LineSkeleton width="w-36" />}
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <ClockIcon className="text-gray-400" />
                  <div>
                    {settings?.workingDays?.[locale] ? (
                      <div>{settings.workingDays[locale]}</div>
                    ) : (
                      <LineSkeleton width="w-24" />
                    )}
                    {settings?.hours ? (
                      <div className="text-sm text-gray-400">{settings.hours}</div>
                    ) : (
                      <div className="mt-1"><LineSkeleton width="w-20" /></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">{t("common.quickLinks")}</h3>
              <div className="space-y-2">
                <a href="#menu" className="block text-gray-300 hover:text-white transition-colors">{t("common.menu")}</a>
                {/* Admin link removed from footer quick links */}
                <button onClick={() => setCartOpen(true)} className="block text-gray-300 hover:text-white transition-colors text-left">
                  {t("common.cart")} ({detailedCart.length})
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {year ?? ""} {t("common.brand")}. All rights reserved. Made with{" "}
              <HeartIcon className="inline w-4 h-4 text-red-400 mx-1" />
              {t("common.madeInGeorgia")}
            </p>
          </div>
        </div>
      </footer>

      {/* Modern Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <CartIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t("common.yourCart")}</h2>
                    <p className="text-sm text-gray-500">{detailedCart.length} {t("common.items")}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-600 text-lg">×</span>
                </button>
              </div>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-6">
              {detailedCart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CartIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{t("home.cartEmpty")}</h3>
                  <p className="text-gray-500 text-sm mb-6">{t("home.addSome")}</p>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="btn-primary"
                  >
                    {t("common.browseMenu")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailedCart.map((item) => (
                    <div key={`${item.productId}-${item.sizeKg}`} className="card p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-amber-50 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🥟</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.sizeKg}kg • {item.unitPrice.toFixed(0)} ₾ each</p>
                          
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => changeQty(item.productId, item.sizeKg, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <span className="text-gray-600">−</span>
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => changeQty(item.productId, item.sizeKg, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <span className="text-gray-600">+</span>
                              </button>
                            </div>
                            
                            <div className="flex-1 text-right">
                              <div className="font-bold text-gray-900">{item.lineTotal.toFixed(0)} ₾</div>
                            </div>
                            
                            <button
                              onClick={() => removeLine(item.productId, item.sizeKg)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors text-red-600"
                            >
                              <span className="text-sm">×</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {detailedCart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t("common.subtotal")}</span>
                    <span className="font-medium">{total.toFixed(0)} ₾</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t("common.delivery")}</span>
                    <span className="text-green-600 font-medium">{t("common.free")}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{t("common.total")}</span>
                      <span className="text-2xl font-bold text-red-600">{total.toFixed(0)} ₾</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setCartOpen(false);
                      setTimeout(() => {
                        document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="btn-primary w-full justify-center text-lg py-4 hover:scale-105 transition-all duration-200"
                  >
                    <CheckIcon />
                    {t("common.continueCheckout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal - Embedded iframe */}
      {paymentUrl && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPaymentUrl(null)} />
          <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[920px] h-[85vh] md:h-[700px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900">Complete your payment</h3>
                <p className="text-sm text-gray-600">Secure payment is embedded below. Close to cancel.</p>
              </div>
              <button onClick={() => setPaymentUrl(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <span className="text-gray-600 text-lg">×</span>
              </button>
            </div>
            <div className="flex-1">
              <div className="w-full h-full flex items-center justify-center p-4">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full md:w-auto justify-center text-base md:text-lg py-3 md:py-4 hover:scale-105 transition-all duration-200"
                >
                  Open secure payment in a new tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


