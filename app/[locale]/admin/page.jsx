"use client";

import { useEffect, useMemo, useState } from "react";
import {useLocale} from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
                <span className="font-bold text-lg text-gray-900">Khinkalito Admin</span>
                <span className="text-xs text-gray-500">Management Dashboard</span>
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
                <span className="hidden sm:inline">Back to Site</span>
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
              Products
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
              Orders
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === "products" ? <ProductsAdmin /> : <OrdersAdmin />}
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ name: "", description: "", image: null, sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setDraft({ name: "", description: "", image: null, sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
        refresh();
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Product Form */}
      <div className="card card-elevated">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">+</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create New Product</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input 
                type="text"
                placeholder="e.g., Traditional Beef Khinkali" 
                value={draft.name} 
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} 
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                placeholder="Describe the product, ingredients, and preparation..." 
                value={draft.description} 
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} 
                className="input-field resize-none h-24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Product Image</label>
              <div className="space-y-3">
                {draft.image ? (
                  <div className="relative">
                    <img 
                      src={draft.image} 
                      alt="Product preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button 
                      onClick={() => setDraft({ ...draft, image: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="image-upload-create" className="cursor-pointer text-red-600 hover:text-red-700 font-medium">
                          Click to upload
                        </label>
                        <span> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                    <input
                      id="image-upload-create"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const imageUrl = await handleImageUpload(file);
                          if (imageUrl) {
                            setDraft({ ...draft, image: imageUrl });
                          }
                        }
                      }}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </div>
                )}
                {uploadingImage && (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-600">Uploading image...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Size Options & Pricing</label>
              <div className="space-y-3">
                {draft.sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Size:</span>
                      <span className="px-2 py-1 bg-white rounded-md text-sm font-medium">{s.sizeKg} kg</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-gray-600">Price:</span>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.1"
                        value={s.price} 
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const ns = [...draft.sizes];
                          ns[idx] = { ...ns[idx], price: v };
                          setDraft({ ...draft, sizes: ns });
                        }} 
                        className="input-field w-24"
                      />
                      <span className="text-sm font-medium text-gray-600">₾</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <input 
                type="checkbox" 
                id="active-checkbox"
                checked={draft.active} 
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })} 
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="active-checkbox" className="text-sm font-medium text-gray-700">
                Product is active and available for ordering
              </label>
            </div>
            
            <button 
              disabled={loading || !draft.name.trim()} 
              onClick={createProduct} 
              className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Product..." : "Create Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Existing Products</h2>
          <span className="text-sm text-gray-500">{products.length} products</span>
        </div>
        
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="card hover:shadow-lg transition-all duration-200">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <input 
                      className="text-lg font-bold text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-red-500 focus:outline-none w-full pb-1" 
                      value={p.name} 
                      onChange={(e) => updateProduct({ ...p, name: e.target.value })} 
                    />
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={p.active} 
                        onChange={(e) => updateProduct({ ...p, active: e.target.checked })} 
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className={`text-sm font-medium ${p.active ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Product Image Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  {p.image ? (
                    <div className="relative">
                      <img 
                        src={p.image} 
                        alt={p.name} 
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
                            Add product image
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
                      <span className="text-sm text-gray-600">Uploading image...</span>
                    </div>
                  )}
                </div>
                
                <textarea 
                  className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none resize-none" 
                  rows="2"
                  value={p.description} 
                  onChange={(e) => updateProduct({ ...p, description: e.target.value })} 
                />
                
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Pricing:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {p.sizes.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 w-16">{s.sizeKg} kg</span>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.1"
                          value={s.price} 
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            const ns = [...p.sizes];
                            ns[idx] = { ...ns[idx], price: v };
                            updateProduct({ ...p, sizes: ns });
                          }} 
                          className="input-field w-20 text-center"
                        />
                        <span className="text-sm font-medium text-gray-600">₾</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                  <button 
                    className="text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors" 
                    onClick={() => deleteProduct(p.id)}
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 text-sm">Create your first product to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("today");

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
              <h2 className="text-xl font-bold text-gray-900">Orders Management</h2>
              <span className="text-sm text-gray-500">({orders.length} orders)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select 
                className="input-field w-auto min-w-[160px]" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="today">Today's Orders</option>
                <option value="pending">Pending Orders</option>
                <option value="all">All Orders</option>
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
                <div className="text-sm font-medium text-gray-700 mb-1">📍 Delivery Address:</div>
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
                <div className="text-sm font-medium text-gray-700 mb-2">Order Items:</div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-amber-50 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🥟</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.sizeKg}kg • Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{item.lineTotal.toFixed(0)} ₾</div>
                        <div className="text-sm text-gray-500">{(item.lineTotal / item.quantity).toFixed(0)} ₾ each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Update order status:
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
                    Pending
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "preparing")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "preparing" 
                        ? "bg-blue-100 text-blue-800 border border-blue-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                  >
                    Preparing
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "sent")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "sent" 
                        ? "bg-purple-100 text-purple-800 border border-purple-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50 hover:border-purple-300"
                    }`}
                  >
                    Sent
                  </button>
                  <button 
                    onClick={() => setStatus(order.id, "completed")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      order.status === "completed" 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-300"
                    }`}
                  >
                    Completed
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
            <h3 className="font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">
              {filter === "today" ? "No orders have been placed today yet." : 
               filter === "pending" ? "No pending orders at the moment." : 
               "No orders have been placed yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


