"use client";

import { useEffect, useMemo, useState } from "react";
import {useLocale, useTranslations} from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import enMessages from "../../../messages/en.json";
import kaMessages from "../../../messages/ka.json";

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PackageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M12 2L2 7v10c0 5.55 3.84 9.99 9 11 5.16-1.01 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShoppingCartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="M3 4h1.4a1 1 0 0 1 .97.76L7 12.5a2 2 0 0 0 1.95 1.5H17a2 2 0 0 0 1.94-1.49l1.34-5.02A1 1 0 0 0 19.34 6H6.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <path d="m12 19-7-7 7-7M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CreditCardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export default function AdminPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [tab, setTab] = useState("products");
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      setAuthError(null);
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setAuthUser(null);
      } else {
        const data = await res.json();
        if (data?.authenticated) setAuthUser(data.user);
        else setAuthUser(null);
      }
    } catch (e) {
      setAuthUser(null);
    } finally {
      setAuthChecked(true);
    }
  }

  async function handleLogin(e) {
    e?.preventDefault?.();
    setLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      setLoginUsername("");
      setLoginPassword("");
      await checkAuth();
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    setAuthUser(null);
    setAuthChecked(true);
  }
  
  if (!authChecked) {
    return (
      <div className="admin min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="admin min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        <header className="sticky top-0 z-10 glass-effect border-b border-white/20 shadow-sm">
          <nav className="container mx-auto">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base md:text-lg text-gray-900">{t("admin.title", { default: "Khinkalito Admin" })}</span>
                  <span className="text-[11px] md:text-xs text-gray-500">{t("admin.subtitle", { default: "Management Dashboard" })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <LanguageSwitcher />
                <a 
                  href={`/${locale}`} 
                  className="btn-secondary hover:scale-105 transition-all duration-200"
                >
                  <ArrowLeftIcon />
                  <span className="hidden md:inline">{t("admin.back", { default: "Back to Site" })}</span>
                </a>
              </div>
            </div>
          </nav>
        </header>

        <div className="container mx-auto py-8">
          <div className="max-w-md mx-auto card">
            <form className="p-5 md:p-6 space-y-4" onSubmit={handleLogin}>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Admin Login</h1>
              {authError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">{authError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  className="input-field"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password"
                  className="input-field"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                disabled={loggingIn || !loginUsername || !loginPassword}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loggingIn ? "Signing in..." : "Sign In"}
              </button>
              <div className="text-xs text-gray-500">
                Tip: default admin is <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Modern Admin Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-sm">
        <nav className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 md:h-20 md:py-0">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-900">{t("admin.title", { default: "Khinkalito Admin" })}</span>
                <span className="text-[11px] md:text-xs text-gray-500">{t("admin.subtitle", { default: "Management Dashboard" })}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-1 md:gap-2 w-full md:w-auto justify-end">
              <LanguageSwitcher />
              <button 
                onClick={handleLogout} 
                className="btn-secondary hover:scale-105 transition-all duration-200"
                title="Logout"
              >
                ⎋
                <span className="hidden md:inline ml-1">Logout</span>
              </button>
              <a 
                href={`/${locale}`} 
                className="btn-secondary hover:scale-105 transition-all duration-200"
              >
                <ArrowLeftIcon />
                <span className="hidden md:inline">{t("admin.back", { default: "Back to Site" })}</span>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <div className="container mx-auto py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          {/* Mobile: custom dropdown (no native select) */}
          <div className="md:hidden mb-3 relative">
            <button
              onClick={() => setMobileTabsOpen((v) => !v)}
              className={`w-full justify-between btn-secondary ${mobileTabsOpen ? "ring-2 ring-red-200" : ""}`}
            >
              <span className="flex items-center gap-2">
                {tab === "products" ? <PackageIcon /> : tab === "orders" ? <ShoppingCartIcon /> : tab === "payments" ? <CreditCardIcon /> : <span>⚙️</span>}
                {tab === "products" ? t("admin.tabs.products", { default: "Products" }) : tab === "orders" ? t("admin.tabs.orders", { default: "Orders" }) : tab === "payments" ? t("admin.tabs.payments", { default: "Payments" }) : "Settings"}
              </span>
              <span className="text-gray-500">▾</span>
            </button>
            {mobileTabsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMobileTabsOpen(false)} />
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2">
                  <button
                    onClick={() => { setTab("products"); setMobileTabsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 ${tab === "products" ? "bg-red-50 text-red-700" : "hover:bg-gray-50"}`}
                  >
                    <PackageIcon />
                    {t("admin.tabs.products", { default: "Products" })}
                  </button>
                  <button
                    onClick={() => { setTab("orders"); setMobileTabsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 ${tab === "orders" ? "bg-red-50 text-red-700" : "hover:bg-gray-50"}`}
                  >
                    <ShoppingCartIcon />
                    {t("admin.tabs.orders", { default: "Orders" })}
                  </button>
                  <button
                    onClick={() => { setTab("payments"); setMobileTabsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 ${tab === "payments" ? "bg-red-50 text-red-700" : "hover:bg-gray-50"}`}
                  >
                    <CreditCardIcon />
                    {t("admin.tabs.payments", { default: "Payments" })}
                  </button>
                  <button
                    onClick={() => { setTab("settings"); setMobileTabsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 ${tab === "settings" ? "bg-red-50 text-red-700" : "hover:bg-gray-50"}`}
                  >
                    <span>⚙️</span>
                    Settings
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop: full tab bar */}
          <nav className="hidden md:flex gap-2 p-2 bg-white rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto">
            <button 
              onClick={() => setTab("products")} 
              className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === "products" 
                  ? "bg-red-600 text-white shadow-lg transform scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <PackageIcon />
              {t("admin.tabs.products", { default: "Products" })}
            </button>
            <button 
              onClick={() => setTab("orders")} 
              className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === "orders" 
                  ? "bg-red-600 text-white shadow-lg transform scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ShoppingCartIcon />
              {t("admin.tabs.orders", { default: "Orders" })}
            </button>
            <button 
              onClick={() => setTab("payments")} 
              className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === "payments" 
                  ? "bg-red-600 text-white shadow-lg transform scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <CreditCardIcon />
              {t("admin.tabs.payments", { default: "Payments" })}
            </button>
            <button 
              onClick={() => setTab("settings")} 
              className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === "settings" 
                  ? "bg-red-600 text-white shadow-lg transform scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span>⚙️</span>
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === "products" ? <ProductsAdmin /> : tab === "orders" ? <OrdersAdmin /> : tab === "payments" ? <PaymentsAdmin /> : <SettingsAdmin />}
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ nameEn: "", nameKa: "", descriptionEn: "", descriptionKa: "", image: null, sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editDrafts, setEditDrafts] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const locale = useLocale();
  const t = useTranslations();

  useEffect(() => {
    refresh();
  }, []);
  
  function refresh() {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }

  async function createProduct() {
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEn: draft.nameEn,
          nameKa: draft.nameKa,
          descriptionEn: draft.descriptionEn,
          descriptionKa: draft.descriptionKa,
          image: draft.image,
          sizes: draft.sizes,
          active: draft.active
        }),
      });
      if (res.ok) {
        setDraft({ nameEn: "", nameKa: "", descriptionEn: "", descriptionKa: "", image: null, sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
        refresh();
        setShowCreate(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProduct(p) {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    refresh();
  }

  async function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      refresh();
    }
  }

  async function handleImageUpload(file, isEdit = false, productId = null) {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setUploadingImage(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to upload image");
        return null;
      }
      
      const result = await response.json();
      
      if (isEdit && productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          await updateProduct({ ...product, image: result.url });
        }
      }
      
      return result.url;
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeProductImage(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.image) return;
    
    if (confirm("Are you sure you want to remove this image?")) {
      const isApiImage = product.image.startsWith('/api/images/');
      const imageId = isApiImage ? product.image.split('/').pop() : null;
      
      try {
        if (imageId) {
          await fetch(`/api/upload?id=${imageId}`, { method: "DELETE" });
        } else {
          const filename = product.image.split('/').pop();
          await fetch(`/api/upload?filename=${filename}`, { method: "DELETE" });
        }
        await updateProduct({ ...product, image: null });
      } catch (error) {
        console.error("Failed to remove image:", error);
        alert("Failed to remove image");
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Product Modal trigger is in header below */}

      {/* Products List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t("admin.list.title", { default: "Existing Products" })}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{products.length} {t("admin.list.countLabel", { default: "products" })}</span>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              {t("admin.create.open", { default: "Add New Product" })}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {products.map((p) => {
            const currentName = typeof p.name === 'object' ? { en: p.name.en || "", ka: p.name.ka || "" } : { en: p.name || "", ka: "" };
            const currentDesc = typeof p.description === 'object' ? { en: p.description.en || "", ka: p.description.ka || "" } : { en: p.description || "", ka: "" };
            const d = editDrafts[p.id] || { nameEn: currentName.en, nameKa: currentName.ka, descriptionEn: currentDesc.en, descriptionKa: currentDesc.ka, sizes: p.sizes || [], active: p.active };
            const changed = d.nameEn !== currentName.en || d.nameKa !== currentName.ka || d.descriptionEn !== currentDesc.en || d.descriptionKa !== currentDesc.ka || d.active !== p.active || JSON.stringify(d.sizes) !== JSON.stringify(p.sizes);
            const setD = (partial) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...d, ...partial } }));
            return (
              <div key={p.id} className="card hover:shadow-lg transition-all duration-200">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <input 
                          className="text-lg font-bold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-red-500 focus:outline-none w-full pb-1" 
                          value={d.nameEn}
                          placeholder={t("admin.create.nameEn", { default: "Product Name (English)" })}
                          onChange={(e) => setD({ nameEn: e.target.value })} 
                        />
                        <input 
                          className="text-lg font-bold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-red-500 focus:outline-none w-full pb-1" 
                          value={d.nameKa}
                          placeholder={t("admin.create.nameKa", { default: "Product Name (Georgian)" })}
                          onChange={(e) => setD({ nameKa: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={d.active} 
                          onChange={(e) => setD({ active: e.target.checked })} 
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className={`text-sm font-medium ${d.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {d.active ? t("admin.product.active", { default: "Active" }) : t("admin.product.inactive", { default: "Inactive" })}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Product Image Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.create.image", { default: "Product Image" })}</label>
                    {p.image ? (
                      <div className="relative">
                        <img 
                          src={p.image} 
                          alt={typeof p.name === 'object' ? (p.name[locale] || p.name.en || p.name.ka || "") : p.name} 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <label className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                            📷
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleImageUpload(file, true, p.id);
                                }
                              }}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>
                          <button 
                            onClick={() => removeProductImage(p.id)}
                            className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <div className="space-y-2">
                          <div className="mx-auto w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📷</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <label htmlFor={`image-upload-${p.id}`} className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                              {t("admin.product.addImage", { default: "Add product image" })}
                            </label>
                          </div>
                          <input
                            id={`image-upload-${p.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file, true, p.id);
                              }
                            }}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </div>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="text-center py-2">
                        <span className="text-sm text-gray-600">{t("admin.create.uploading", { default: "Uploading image..." })}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <textarea 
                      className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none resize-none" 
                      rows="3"
                      value={d.descriptionEn}
                      placeholder={t("admin.create.descriptionEn", { default: "Description (English)" })}
                      onChange={(e) => setD({ descriptionEn: e.target.value })}
                    />
                    <textarea 
                      className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none resize-none" 
                      rows="3"
                      value={d.descriptionKa}
                      placeholder={t("admin.create.descriptionKa", { default: "Description (Georgian)" })}
                      onChange={(e) => setD({ descriptionKa: e.target.value })}
                    />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium text-gray-700">{t("admin.product.pricing", { default: "Pricing:" })}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {(d.sizes || []).map((s, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 w-16">{s.sizeKg} kg</span>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.1"
                            value={s.price} 
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              const ns = [...d.sizes];
                              ns[idx] = { ...ns[idx], price: v };
                              setD({ sizes: ns });
                            }} 
                            className="input-field w-20 text-center"
                          />
                          <span className="text-sm font-medium text-gray-600">₾</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button 
                        disabled={!changed}
                        onClick={() => setEditDrafts((prev) => { const cp = { ...prev }; delete cp[p.id]; return cp; })}
                        className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 disabled:opacity-50"
                      >
                        {t('admin.product.reset', { default: 'Reset' })}
                      </button>
                      <button 
                        disabled={!changed}
                        onClick={() => updateProduct({ id: p.id, nameEn: d.nameEn, nameKa: d.nameKa, descriptionEn: d.descriptionEn, descriptionKa: d.descriptionKa, sizes: d.sizes, active: d.active }).then(() => setEditDrafts(prev => { const cp = { ...prev }; delete cp[p.id]; return cp; }))}
                        className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                      >
                        {t('admin.product.save', { default: 'Save Changes' })}
                      </button>
                    </div>
                    <button 
                      className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors" 
                      onClick={() => deleteProduct(p.id)}
                    >
                      {t("admin.product.delete", { default: "Delete Product" })}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{t("admin.list.emptyTitle", { default: "No products yet" })}</h3>
              <p className="text-gray-500 text-sm">{t("admin.list.emptyDesc", { default: "Create your first product to get started." })}</p>
            </div>
          )}
        </div>
      </div>
      {/* Create Product Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="absolute inset-0 p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-green-600 font-bold text-lg">+</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{t("admin.create.title", { default: "Create New Product" })}</h2>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">×</button>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.create.nameEn", { default: "Product Name (English)" })}</label>
                      <input type="text" placeholder="Traditional Beef Khinkali" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.create.nameKa", { default: "Product Name (Georgian)" })}</label>
                      <input type="text" placeholder="ქართული სახელი" value={draft.nameKa} onChange={(e) => setDraft({ ...draft, nameKa: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.create.descriptionEn", { default: "Description (English)" })}</label>
                      <textarea placeholder={t("admin.create.descriptionEn", { default: "Description (English)" }) + "..."} value={draft.descriptionEn} onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })} className="input-field resize-none h-24" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("admin.create.descriptionKa", { default: "Description (Georgian)" })}</label>
                      <textarea placeholder={t("admin.create.descriptionKa", { default: "Description (Georgian)" }) + "..."} value={draft.descriptionKa} onChange={(e) => setDraft({ ...draft, descriptionKa: e.target.value })} className="input-field resize-none h-24" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("admin.create.image", { default: "Product Image" })}</label>
                    <div className="space-y-3">
                      {draft.image ? (
                        <div className="relative">
                          <img src={draft.image} alt="Product preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => setDraft({ ...draft, image: null })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors">×</button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <div className="space-y-2">
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-2xl">📷</span></div>
                            <div className="text-sm text-gray-600">
                              <label htmlFor="image-upload-create" className="cursor-pointer text-red-600 hover:text-red-700 font-medium">{t("admin.create.clickToUpload", { default: "Click to upload" })}</label>
                              <span> {t("admin.create.orDragDrop", { default: "or drag and drop" })}</span>
                            </div>
                            <p className="text-xs text-gray-500">{t("admin.create.pngInfo", { default: "PNG, JPG, WebP up to 5MB" })}</p>
                          </div>
                          <input id="image-upload-create" type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (file) { const imageUrl = await handleImageUpload(file); if (imageUrl) { setDraft({ ...draft, image: imageUrl }); } } }} className="hidden" disabled={uploadingImage} />
                        </div>
                      )}
                      {uploadingImage && (<div className="text-center py-2"><span className="text-sm text-gray-600">{t("admin.create.uploading", { default: "Uploading image..." })}</span></div>)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("admin.create.sizePricing", { default: "Size Options & Pricing" })}</label>
                    <div className="space-y-3">
                      {draft.sizes.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-600">{t("admin.create.size", { default: "Size:" })}</span><span className="px-2 py-1 bg-white rounded-md text-sm font-medium">{s.sizeKg} kg</span></div>
                          <div className="flex items-center gap-2 flex-1"><span className="text-sm font-medium text-gray-600">{t("admin.create.price", { default: "Price:" })}</span><input type="number" min="0" step="0.1" value={s.price} onChange={(e) => { const v = Number(e.target.value); const ns = [...draft.sizes]; ns[idx] = { ...ns[idx], price: v }; setDraft({ ...draft, sizes: ns }); }} className="input-field w-24" /><span className="text-sm font-medium text-gray-600">₾</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <input type="checkbox" id="active-checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <label htmlFor="active-checkbox" className="text-sm font-medium text-gray-700">{t("admin.create.activeLabel", { default: "Product is active and available for ordering" })}</label>
                  </div>
                  <button disabled={loading || (!draft.nameEn.trim() && !draft.nameKa.trim())} onClick={createProduct} className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? t("admin.create.creating", { default: "Creating Product..." }) : t("admin.create.create", { default: "Create Product" })}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("today");
  const t = useTranslations();

  useEffect(() => {
    refresh();
  }, [filter]);

  function refresh() {
    const url = new URL("/api/orders", window.location.origin);
    if (filter === "pending") url.searchParams.set("status", "pending");
    fetch(url.toString()).then((r) => r.json()).then((data) => {
      const list = data;
      if (filter === "today") {
        const today = new Date().toISOString().slice(0, 10);
        setOrders(list.filter((o) => (o.createdAt || "").slice(0, 10) === today));
      } else {
        setOrders(list);
      }
    });
  }

  async function setStatus(id, status) {
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "sent": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 md:gap-0 md:flex-row flex-col items-start">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <h2 className="text-xl font-bold text-gray-900">{t("admin.orders.title", { default: "Orders Management" })}</h2>
              <span className="text-sm text-gray-500">({orders.length} {t("admin.orders.countLabel", { default: "orders" })})</span>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto md:justify-end">
              <label className="text-sm font-medium text-gray-700 min-w-[64px]">{t("admin.orders.filter", { default: "Filter:" })}</label>
              <select 
                className="input-field w-full md:w-auto min-w-[160px]" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="today">{t("admin.orders.today", { default: "Today's Orders" })}</option>
                <option value="pending">{t("admin.orders.pending", { default: "Pending Orders" })}</option>
                <option value="all">{t("admin.orders.all", { default: "All Orders" })}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.customer.firstName} {order.customer.lastName}
                  </h3>
                  <div className="flex items-center gap-3 md:gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                    <a href={`tel:${order.customer.phone}`} className="underline decoration-dotted underline-offset-2">📞 {order.customer.phone}</a>
                    <span className="opacity-60">•</span>
                    <span>🕒 {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="text-right w-full md:w-auto mt-3 md:mt-0">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {order.total.toFixed(0)} ₾
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">📍 {t("admin.orders.deliveryAddress", { default: "Delivery Address:" })}</div>
                <div className="text-sm text-gray-600">
                  {order.address.text || (
                    order.address.location 
                      ? `Map Location: ${order.address.location.lat.toFixed(5)}, ${order.address.location.lng.toFixed(5)}`
                      : "No address provided"
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">{t("admin.orders.items", { default: "Order Items:" })}</div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-amber-50 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🥟</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.sizeKg}kg • {t("admin.orders.qty", { default: "Qty" })}: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{item.lineTotal.toFixed(0)} ₾</div>
                        <div className="text-sm text-gray-500">{(item.lineTotal / item.quantity).toFixed(0)} ₾ {t("admin.orders.each", { default: "each" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 md:flex-row flex-col gap-3 md:gap-0">
                <div className="text-sm text-gray-500 w-full md:w-auto">
                  {t("admin.orders.updateStatus", { default: "Update order status:" })}
                </div>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto -mx-2 px-2 pb-1">
                  <button 
                    onClick={() => setStatus(order.id, "pending")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "pending" 
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300"
                    }`}
                  >
                    {t("admin.orders.status.pending", { default: "Pending" })}
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "preparing")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "preparing" 
                        ? "bg-blue-100 text-blue-800 border border-blue-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                  >
                    {t("admin.orders.status.preparing", { default: "Preparing" })}
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "sent")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "sent" 
                        ? "bg-purple-100 text-purple-800 border border-purple-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50 hover:border-purple-300"
                    }`}
                  >
                    {t("admin.orders.status.sent", { default: "Sent" })}
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "completed")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "completed" 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-300"
                    }`}
                  >
                    {t("admin.orders.status.completed", { default: "Completed" })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">{t("admin.orders.noneTitle", { default: "No orders found" })}</h3>
            <p className="text-gray-500 text-sm">
              {filter === "today" ? t("admin.orders.noneToday", { default: "No orders have been placed today yet." }) : 
               filter === "pending" ? t("admin.orders.nonePending", { default: "No pending orders at the moment." }) : 
               t("admin.orders.noneAll", { default: "No orders have been placed yet." })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundModal, setRefundModal] = useState(null); // { order, isPartial, amount }
  const [refundPassword, setRefundPassword] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);
  const t = useTranslations();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "paid") params.append("status", "paid");
      else if (filter === "pending") params.append("status", "pending");
      else if (filter === "failed") params.append("status", "failed");
      else if (filter === "refunded") {
        // Get both full and partial refunds
        params.append("status", "refunded,refunded_partially");
      }
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Only show orders with payments
        const ordersWithPayments = (data || []).filter((o) => o.payments && o.payments.length > 0);
        
        // If filtering for refunded, also check order status
        if (filter === "refunded") {
          setOrders(ordersWithPayments.filter((o) => 
            o.status === "refunded" || 
            o.status === "refunded_partially" ||
            o.status === "refund_pending" ||
            o.status === "refund_pending_partial"
          ));
        } else {
          setOrders(ordersWithPayments);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function syncWithBank() {
    setSyncing(true);
    try {
      const res = await fetch("/api/payments/ipay/sync", { method: "POST" });
      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }

  function openRefundModal(order, isPartial = false) {
    setRefundModal({ order, isPartial });
    setRefundPassword("");
    setRefundAmount(isPartial ? "" : order.total.toString());
    setRefundError(null);
  }

  function closeRefundModal() {
    setRefundModal(null);
    setRefundPassword("");
    setRefundAmount("");
    setRefundError(null);
  }

  async function handleRefund() {
    if (!refundModal) return;
    
    setRefunding(true);
    setRefundError(null);

    try {
      const payload = {
        orderId: refundModal.order.id,
        adminPassword: refundPassword,
      };

      // Add amount for partial refund
      if (refundModal.isPartial && refundAmount) {
        payload.amount = parseFloat(refundAmount);
      }

      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setRefundError(data.error + (data.details ? `: ${data.details}` : ""));
        return;
      }

      // Success! Show appropriate message
      if (data.manualMode) {
        // Show detailed manual refund instructions
        alert(data.message);
      } else {
        alert(data.message || "Refund processed successfully!");
      }
      
      closeRefundModal();
      fetchOrders();
    } catch (error) {
      setRefundError("Failed to process refund: " + error.message);
    } finally {
      setRefunding(false);
    }
  }

  function canRefund(order) {
    // Check if order is paid/completed or pending refund
    const refundableStatuses = ["paid", "completed", "refund_pending", "refund_pending_partial"];
    if (!refundableStatuses.includes(order.status)) {
      return { allowed: false, reason: "Only paid orders can be refunded" };
    }

    // Check if already fully refunded
    const latestPayment = order.payments?.[order.payments.length - 1];
    if (latestPayment?.status === "refunded") {
      return { allowed: false, reason: "Already refunded" };
    }

    // Check 1-week limit
    const paymentDate = new Date(order.createdAt);
    const now = new Date();
    const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return { allowed: false, reason: `Payment is ${Math.floor(daysDiff)} days old (max 7 days)` };
    }

    return { allowed: true };
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "refunded_partially":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "refund_pending":
      case "refund_pending_partial":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t("admin.payments.title", { default: "Payments" })}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {orders.length} {t("admin.payments.countLabel", { default: "payments" })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={syncWithBank}
                disabled={syncing}
                className="btn-primary disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "🔄 Sync with Bank"}
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("admin.payments.filter.all", { default: "All" })}
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "paid"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("admin.payments.filter.paid", { default: "Paid" })}
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("admin.payments.filter.pending", { default: "Pending" })}
            </button>
            <button
              onClick={() => setFilter("refunded")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "refunded"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("admin.payments.filter.refunded", { default: "Refunded" })}
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("admin.payments.filter.failed", { default: "Failed" })}
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-red-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CreditCardIcon className="mx-auto mb-4 text-gray-400" style={{ width: 48, height: 48 }} />
          <p className="text-gray-600">
            {t("admin.payments.empty", { default: "No payments found" })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const latestPayment = order.payments?.[order.payments.length - 1] || {};
            const gatewayOrderId = latestPayment.gatewayOrderId || "-";
            const paymentMethod = latestPayment.paymentMethod || "-";
            return (
              <div key={order.id} className="card hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {order.customer.firstName} {order.customer.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                        <span>📞 {order.customer.phone}</span>
                        <span className="opacity-60">•</span>
                        <span>🕒 {new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                      <div className="text-lg font-bold text-gray-900 mt-1">
                        {order.total.toFixed(0)} ₾
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-1">Order ID</div>
                      <div className="font-mono text-sm text-gray-900">{order.id}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gateway Order ID</div>
                      <div className="font-mono text-sm text-gray-900">{gatewayOrderId}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-1">Gateway</div>
                      <div className="text-sm text-gray-900 uppercase">{latestPayment.gateway || "bog"}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-1">Payment Method</div>
                      <div className="text-sm text-gray-900">{paymentMethod}</div>
                    </div>
                  </div>

                  {latestPayment.lastSyncAt && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs font-medium text-blue-700">
                        Last sync: {new Date(latestPayment.lastSyncAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const refundCheck = canRefund(order);
                        if (refundCheck.allowed) {
                          return (
                            <>
                              <button
                                onClick={() => openRefundModal(order, false)}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                                title="Full refund"
                              >
                                💰 Full Refund
                              </button>
                              <button
                                onClick={() => openRefundModal(order, true)}
                                className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
                                title="Partial refund"
                              >
                                Partial Refund
                              </button>
                            </>
                          );
                        } else {
                          return (
                            <span className="text-xs text-gray-500" title={refundCheck.reason}>
                              ⓘ {refundCheck.reason}
                            </span>
                          );
                        }
                      })()}
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn-secondary"
                    >
                      {t("admin.payments.viewDetails", { default: "View Details" })}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {t("admin.payments.details.title", { default: "Payment Details" })}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-lg">{selectedOrder.total.toFixed(0)} ₾</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedOrder.payments?.[0]?.gatewayResponse && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Gateway Response</p>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedOrder.payments[0].gatewayResponse, null, 2)}
                  </pre>
                </div>
              )}

              {selectedOrder.payments?.[0]?.webhookPayload && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Webhook Payload</p>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedOrder.payments[0].webhookPayload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedOrder.payments?.[0]?.gatewayResponse?.refund && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-3">💰 Refund Information</p>
                  {(() => {
                    const refund = selectedOrder.payments[0].gatewayResponse.refund;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Original Amount:</span>
                          <span className="font-semibold text-purple-900">{refund.originalAmount?.toFixed(2) || selectedOrder.total.toFixed(2)} ₾</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Refunded Amount:</span>
                          <span className="font-semibold text-purple-900">{refund.refundAmount?.toFixed(2) || selectedOrder.total.toFixed(2)} ₾</span>
                        </div>
                        {refund.isPartialRefund && refund.remainingAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-orange-700">Remaining Amount:</span>
                            <span className="font-semibold text-orange-900">{refund.remainingAmount.toFixed(2)} ₾</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-purple-200">
                          <span className="text-purple-700">Refunded By:</span>
                          <span className="font-medium text-purple-900">{refund.refundedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Refunded At:</span>
                          <span className="text-purple-900">{new Date(refund.refundedAt).toLocaleString()}</span>
                        </div>
                        {refund.manualMode && (
                          <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800 text-xs">
                            ⓘ Manual refund - processed via Business Manager
                          </div>
                        )}
                        {refund.refundResult?.action_id && (
                          <div className="flex justify-between pt-2 border-t border-purple-200">
                            <span className="text-purple-700">Action ID:</span>
                            <span className="font-mono text-xs text-purple-900">{refund.refundResult.action_id}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚠️</span>
                {refundModal.isPartial ? "Partial Refund" : "Full Refund"}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="text-sm font-medium">
                    {refundModal.order.customer.firstName} {refundModal.order.customer.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Total:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {refundModal.order.total.toFixed(2)} ₾
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <span className="text-sm">
                    {new Date(refundModal.order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Partial Refund Amount Input */}
              {refundModal.isPartial && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (₾)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={refundModal.order.total}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="input-field"
                    placeholder="Enter amount to refund"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {refundModal.order.total.toFixed(2)} ₾
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <div className="flex gap-2">
                  <span className="text-yellow-600 font-bold">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This action cannot be undone</li>
                      <li>Funds will be returned to customer's card</li>
                      <li>Processing may take 3-5 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔐 Confirm Admin Password
                </label>
                <input
                  type="password"
                  value={refundPassword}
                  onChange={(e) => setRefundPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your admin password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && refundPassword && (!refundModal.isPartial || refundAmount)) {
                      handleRefund();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your password is required to authorize this refund
                </p>
              </div>

              {/* Error Display */}
              {refundError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">Error:</span> {refundError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeRefundModal}
                  disabled={refunding}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refunding || !refundPassword || (refundModal.isPartial && !refundAmount)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refunding ? "Processing..." : `Refund ${refundModal.isPartial ? refundAmount + " ₾" : "Full Amount"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsAdmin() {
  const [settings, setSettings] = useState({ phone: "", hours: "", deliveringUntil: "", address: "", city: "", workingDays: { en: "", ka: "" }, ratingValue: "", deliveryMinutes: "", happyCustomers: "", heroImage: null, freeDeliveryThreshold: 0, heroTitle: { en: "", ka: "" }, heroDesc: { en: "", ka: "" }, aboutTitle: { en: "", ka: "" }, about1: { en: "", ka: "" }, menuDesc: { en: "", ka: "" }, completeOrderDesc: { en: "", ka: "" }, whatsappManagerPhones: [] });
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      const s = data || {};
      const merged = {
        ...s,
        // Back-compat: migrate single phone to array if needed
        whatsappManagerPhones: Array.isArray(s.whatsappManagerPhones)
          ? s.whatsappManagerPhones
          : (s.whatsappManagerPhone ? [s.whatsappManagerPhone] : []),
        freeDeliveryThreshold: Number.isFinite(Number(s.freeDeliveryThreshold)) ? Number(s.freeDeliveryThreshold) : 0,
        heroTitle: {
          en: (s.heroTitle && s.heroTitle.en) || enMessages.home.heroTitle,
          ka: (s.heroTitle && s.heroTitle.ka) || kaMessages.home.heroTitle,
        },
        heroDesc: {
          en: (s.heroDesc && s.heroDesc.en) || enMessages.home.heroDesc,
          ka: (s.heroDesc && s.heroDesc.ka) || kaMessages.home.heroDesc,
        },
        aboutTitle: {
          en: (s.aboutTitle && s.aboutTitle.en) || enMessages.home.aboutTitle,
          ka: (s.aboutTitle && s.aboutTitle.ka) || kaMessages.home.aboutTitle,
        },
        about1: {
          en: (s.about1 && s.about1.en) || enMessages.home.about1,
          ka: (s.about1 && s.about1.ka) || kaMessages.home.about1,
        },
        menuDesc: {
          en: (s.menuDesc && s.menuDesc.en) || enMessages.home.menuDesc,
          ka: (s.menuDesc && s.menuDesc.ka) || kaMessages.home.menuDesc,
        },
        completeOrderDesc: {
          en: (s.completeOrderDesc && s.completeOrderDesc.en) || enMessages.home.completeOrderDesc,
          ka: (s.completeOrderDesc && s.completeOrderDesc.ka) || kaMessages.home.completeOrderDesc,
        },
        workingDays: {
          en: (s.workingDays && s.workingDays.en) || "Mon - Sun",
          ka: (s.workingDays && s.workingDays.ka) || "ორშ - კვ",
        },
      };
      setSettings(merged);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const data = await res.json();
      setSettings(data);
    } finally {
      setSaving(false);
    }
  }

  async function setAndPersist(partial) {
    const next = { ...settings, ...partial };
    try {
      setSaving(true);
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const data = await res.json();
      setSettings(data);
    } finally {
      setSaving(false);
    }
  }

  async function uploadHeroImage(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingHero(true);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Failed to upload image");
        return;
      }
      const result = await response.json();
      await setAndPersist({ heroImage: result.url });
    } catch (e) {
      console.error(e);
      alert("Failed to upload image");
    } finally {
      setUploadingHero(false);
    }
  }

  async function removeHeroImage() {
    if (!settings?.heroImage) return;
    if (!confirm("Remove hero image?")) return;
    try {
      setUploadingHero(true);
      if (settings.heroImage.startsWith('/api/images/')) {
        const imageId = settings.heroImage.split('/').pop();
        await fetch(`/api/upload?id=${imageId}`, { method: "DELETE" });
      } else {
        const filename = settings.heroImage.split('/').pop();
        await fetch(`/api/upload?filename=${filename}`, { method: "DELETE" });
      }
    } catch (e) {
      // ignore delete failure; still clear reference
    } finally {
      setUploadingHero(false);
      await setAndPersist({ heroImage: null });
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Site Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input className="input-field" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+995 555 123 456" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Manager Phones</label>
              <div className="space-y-2">
                {(settings.whatsappManagerPhones || []).map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      value={p}
                      onChange={(e) => {
                        const arr = [...(settings.whatsappManagerPhones || [])];
                        arr[idx] = e.target.value;
                        setSettings({ ...settings, whatsappManagerPhones: arr });
                      }}
                      placeholder="e.g. +995 555 123 456"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        const arr = (settings.whatsappManagerPhones || []).filter((_, i) => i !== idx);
                        setSettings({ ...settings, whatsappManagerPhones: arr });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSettings({ ...settings, whatsappManagerPhones: [...(settings.whatsappManagerPhones || []), ""] })}
                >
                  Add Number
                </button>
                <div className="text-xs text-gray-500">Messages will be sent to all listed numbers</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
              <input className="input-field" value={settings.hours} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} placeholder="11:00 - 23:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivering Until</label>
              <input className="input-field" value={settings.deliveringUntil} onChange={(e) => setSettings({ ...settings, deliveringUntil: e.target.value })} placeholder="23:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input className="input-field" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Tbilisi, Georgia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input className="input-field" value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} placeholder="Tbilisi" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <input className="input-field" value={settings.ratingValue} onChange={(e) => setSettings({ ...settings, ratingValue: e.target.value })} placeholder="4.9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Minutes</label>
              <input className="input-field" value={settings.deliveryMinutes} onChange={(e) => setSettings({ ...settings, deliveryMinutes: e.target.value })} placeholder="30-45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Happy Customers</label>
              <input className="input-field" value={settings.happyCustomers} onChange={(e) => setSettings({ ...settings, happyCustomers: e.target.value })} placeholder="500+" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Threshold (₾)</label>
              <input 
                type="number"
                min="0"
                step="1"
                className="input-field"
                value={settings.freeDeliveryThreshold}
                onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                placeholder="0 (disabled)"
              />
            </div>
          </div>
          <div className="mt-6">
            <div className="card">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Homepage Hero Image</h3>
                {settings.heroImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img src={settings.heroImage} alt="Hero" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <label className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                          📷
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHeroImage(file); }} disabled={uploadingHero} />
                        </label>
                        <button onClick={removeHeroImage} className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors">×</button>
                      </div>
                    </div>
                    {uploadingHero && <div className="text-sm text-gray-600">Uploading...</div>}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-2xl">📷</span></div>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="hero-image-upload" className="cursor-pointer text-red-600 hover:text-red-700 font-medium">Click to upload hero image</label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                    <input id="hero-image-upload" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHeroImage(file); }} className="hidden" disabled={uploadingHero} />
                    {uploadingHero && (<div className="text-center py-2"><span className="text-sm text-gray-600">Uploading...</span></div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Homepage Texts (EN)</h3>
                <label className="block text-sm font-medium text-gray-700">Hero Title</label>
                <input className="input-field" value={settings.heroTitle?.en || ""} onChange={(e) => setSettings({ ...settings, heroTitle: { ...(settings.heroTitle||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">Hero Description</label>
                <textarea className="input-field h-24 resize-none" value={settings.heroDesc?.en || ""} onChange={(e) => setSettings({ ...settings, heroDesc: { ...(settings.heroDesc||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">About Title</label>
                <input className="input-field" value={settings.aboutTitle?.en || ""} onChange={(e) => setSettings({ ...settings, aboutTitle: { ...(settings.aboutTitle||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">About Text</label>
                <textarea className="input-field h-24 resize-none" value={settings.about1?.en || ""} onChange={(e) => setSettings({ ...settings, about1: { ...(settings.about1||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">Menu Description</label>
                <textarea className="input-field h-24 resize-none" value={settings.menuDesc?.en || ""} onChange={(e) => setSettings({ ...settings, menuDesc: { ...(settings.menuDesc||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">Checkout Description</label>
                <textarea className="input-field h-24 resize-none" value={settings.completeOrderDesc?.en || ""} onChange={(e) => setSettings({ ...settings, completeOrderDesc: { ...(settings.completeOrderDesc||{}), en: e.target.value } })} />
              </div>
            </div>
            <div className="card">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Homepage Texts (KA)</h3>
                <label className="block text-sm font-medium text-gray-700">ჰერო სათაური</label>
                <input className="input-field" value={settings.heroTitle?.ka || ""} onChange={(e) => setSettings({ ...settings, heroTitle: { ...(settings.heroTitle||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">ჰერო აღწერა</label>
                <textarea className="input-field h-24 resize-none" value={settings.heroDesc?.ka || ""} onChange={(e) => setSettings({ ...settings, heroDesc: { ...(settings.heroDesc||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">აბაუთ სათაური</label>
                <input className="input-field" value={settings.aboutTitle?.ka || ""} onChange={(e) => setSettings({ ...settings, aboutTitle: { ...(settings.aboutTitle||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">აბაუთ ტექსტი</label>
                <textarea className="input-field h-24 resize-none" value={settings.about1?.ka || ""} onChange={(e) => setSettings({ ...settings, about1: { ...(settings.about1||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">მენიუს აღწერა</label>
                <textarea className="input-field h-24 resize-none" value={settings.menuDesc?.ka || ""} onChange={(e) => setSettings({ ...settings, menuDesc: { ...(settings.menuDesc||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">შეკვეთის აღწერა</label>
                <textarea className="input-field h-24 resize-none" value={settings.completeOrderDesc?.ka || ""} onChange={(e) => setSettings({ ...settings, completeOrderDesc: { ...(settings.completeOrderDesc||{}), ka: e.target.value } })} />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Footer (EN)</h3>
                <label className="block text-sm font-medium text-gray-700">Working Days</label>
                <input className="input-field" value={settings.workingDays?.en || ""} onChange={(e) => setSettings({ ...settings, workingDays: { ...(settings.workingDays||{}), en: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input className="input-field" value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input className="input-field" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                <label className="block text-sm font-medium text-gray-700">Hours</label>
                <input className="input-field" value={settings.hours || ""} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} />
              </div>
            </div>
            <div className="card">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Footer (KA)</h3>
                <label className="block text-sm font-medium text-gray-700">სამუშაო დღეები</label>
                <input className="input-field" value={settings.workingDays?.ka || ""} onChange={(e) => setSettings({ ...settings, workingDays: { ...(settings.workingDays||{}), ka: e.target.value } })} />
                <label className="block text-sm font-medium text-gray-700">მისამართი</label>
                <input className="input-field" value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                <label className="block text-sm font-medium text-gray-700">ტელეფონი</label>
                <input className="input-field" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                <label className="block text-sm font-medium text-gray-700">სამუშაო საათები</label>
                <input className="input-field" value={settings.hours || ""} onChange={(e) => setSettings({ ...settings, hours: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}


