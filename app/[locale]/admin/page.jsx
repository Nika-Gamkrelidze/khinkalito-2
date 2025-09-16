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

export default function AdminPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [tab, setTab] = useState("products");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Modern Admin Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/20 shadow-sm">
        <nav className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900">{t("admin.title", { default: "Khinkalito Admin" })}</span>
                <span className="text-xs text-gray-500">{t("admin.subtitle", { default: "Management Dashboard" })}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <a 
                href={`/${locale}`} 
                className="btn-secondary hover:scale-105 transition-all duration-200"
              >
                <ArrowLeftIcon />
                <span className="hidden sm:inline">{t("admin.back", { default: "Back to Site" })}</span>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <div className="container mx-auto py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border border-gray-100 w-fit">
            <button 
              onClick={() => setTab("products")} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
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
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === "orders" 
                  ? "bg-red-600 text-white shadow-lg transform scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ShoppingCartIcon />
              {t("admin.tabs.orders", { default: "Orders" })}
            </button>
            <button 
              onClick={() => setTab("settings")} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
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
          {tab === "products" ? <ProductsAdmin /> : tab === "orders" ? <OrdersAdmin /> : <SettingsAdmin />}
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
      const filename = product.image.split('/').pop();
      
      try {
        await fetch(`/api/upload?filename=${filename}`, {
          method: "DELETE",
        });
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">{t("admin.orders.title", { default: "Orders Management" })}</h2>
              <span className="text-sm text-gray-500">({orders.length} {t("admin.orders.countLabel", { default: "orders" })})</span>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">{t("admin.orders.filter", { default: "Filter:" })}</label>
              <select 
                className="input-field w-auto min-w-[160px]" 
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
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>📞 {order.customer.phone}</span>
                    <span>🕒 {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="text-right">
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
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {t("admin.orders.updateStatus", { default: "Update order status:" })}
                </div>
                <div className="flex gap-2">
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

function SettingsAdmin() {
  const [settings, setSettings] = useState({ phone: "", hours: "", deliveringUntil: "", address: "", city: "", workingDays: { en: "", ka: "" }, ratingValue: "", deliveryMinutes: "", happyCustomers: "", heroTitle: { en: "", ka: "" }, heroDesc: { en: "", ka: "" }, aboutTitle: { en: "", ka: "" }, about1: { en: "", ka: "" }, menuDesc: { en: "", ka: "" }, completeOrderDesc: { en: "", ka: "" } });
  const [saving, setSaving] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      const s = data || {};
      const merged = {
        ...s,
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

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Site Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input className="input-field" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+995 555 123 456" />
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
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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


