"use client";

import { useEffect, useMemo, useState } from "react";

export default function AdminPage() {
  const [tab, setTab] = useState("products");
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-50 via-white to-amber-50">
      <div className="sticky top-0 z-20 border-b backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-rose-600" />
            <div className="font-semibold">Khinkalito — Admin</div>
          </div>
          <a className="text-sm underline" href="/">Back to site</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        <nav className="flex gap-3">
          <button onClick={() => setTab("products")} className={`px-3 py-1.5 rounded-full border ${tab === "products" ? "bg-rose-600 text-white border-rose-600" : "hover:bg-black/5"}`}>Products</button>
          <button onClick={() => setTab("orders")} className={`px-3 py-1.5 rounded-full border ${tab === "orders" ? "bg-rose-600 text-white border-rose-600" : "hover:bg-black/5"}`}>Orders</button>
        </nav>
        {tab === "products" ? <ProductsAdmin /> : <OrdersAdmin />}
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ name: "", description: "", sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
  const [loading, setLoading] = useState(false);

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
        setDraft({ name: "", description: "", sizes: [{ sizeKg: 0.5, price: 0 }, { sizeKg: 0.8, price: 0 }], active: true });
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
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded-2xl bg-white p-5 md:p-6 flex flex-col gap-3">
        <h2 className="font-semibold">Create product</h2>
        <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="border rounded-lg px-3 py-2" />
        <textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="border rounded-lg px-3 py-2 min-h-[80px]" />
        <div className="grid grid-cols-2 gap-2">
          {draft.sizes.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-16">{s.sizeKg} kg</div>
              <input type="number" value={s.price} onChange={(e) => {
                const v = Number(e.target.value);
                const ns = [...draft.sizes];
                ns[idx] = { ...ns[idx], price: v };
                setDraft({ ...draft, sizes: ns });
              }} className="border rounded-lg px-2 py-1 w-28" />
              <div>₾</div>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
        <button disabled={loading} onClick={createProduct} className="px-4 py-2 rounded-xl bg-rose-600 text-white disabled:opacity-50 hover:bg-rose-700">{loading ? "Creating..." : "Create"}</button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">Products</h2>
        {products.map((p) => (
          <div key={p.id} className="border rounded-2xl bg-white p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <input className="font-medium border rounded-lg px-2 py-1 flex-1 mr-2" value={p.name} onChange={(e) => updateProduct({ ...p, name: e.target.value })} />
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={p.active} onChange={(e) => updateProduct({ ...p, active: e.target.checked })} /> Active</label>
            </div>
            <textarea className="border rounded-lg px-2 py-1" value={p.description} onChange={(e) => updateProduct({ ...p, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              {p.sizes.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-16">{s.sizeKg} kg</div>
                  <input type="number" value={s.price} onChange={(e) => {
                    const v = Number(e.target.value);
                    const ns = [...p.sizes];
                    ns[idx] = { ...ns[idx], price: v };
                    updateProduct({ ...p, sizes: ns });
                  }} className="border rounded-lg px-2 py-1 w-28" />
                  <div>₾</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button className="text-red-600 text-sm" onClick={() => deleteProduct(p.id)}>Delete</button>
            </div>
          </div>
        ))}
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Filter:</span>
        <select className="border rounded-lg px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="today">Orders sent today</option>
          <option value="pending">Pending orders</option>
          <option value="all">All orders</option>
        </select>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="border rounded-2xl bg-white p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="font-medium">{o.customer.firstName} {o.customer.lastName} — {o.customer.phone}</div>
            <div className="text-sm">Status: <span className="font-semibold">{o.status}</span></div>
          </div>
          <div className="text-sm">Address: {o.address.text || (o.address.location ? `Map(${o.address.location.lat.toFixed(5)}, ${o.address.location.lng.toFixed(5)})` : "-")}</div>
          <ul className="text-sm list-disc ml-5">
            {o.items.map((i, idx) => (
              <li key={idx}>{i.productName} {i.sizeKg}kg ×{i.quantity} — {i.lineTotal.toFixed(2)} ₾</li>
            ))}
          </ul>
          <div className="font-semibold text-right">Total: {o.total.toFixed(2)} ₾</div>
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1.5 rounded-full border hover:bg-black/5" onClick={() => setStatus(o.id, "pending")}>Pending</button>
            <button className="px-3 py-1.5 rounded-full border hover:bg-black/5" onClick={() => setStatus(o.id, "preparing")}>Preparing</button>
            <button className="px-3 py-1.5 rounded-full border hover:bg-black/5" onClick={() => setStatus(o.id, "sent")}>Sent</button>
            <button className="px-3 py-1.5 rounded-full border hover:bg-black/5" onClick={() => setStatus(o.id, "completed")}>Completed</button>
          </div>
        </div>
      ))}
      {orders.length === 0 ? <div className="text-sm text-black/60">No orders yet.</div> : null}
    </div>
  );
}


