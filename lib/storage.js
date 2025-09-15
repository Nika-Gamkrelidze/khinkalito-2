import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const ordersFile = path.join(dataDir, "orders.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function ensureSeedData() {
  ensureDataDir();
  if (!fs.existsSync(productsFile)) {
    const seedProducts = [
      {
        id: crypto.randomUUID(),
        name: "Traditional Beef & Pork Khinkali",
        description: "Classic Georgian khinkali with juicy beef-pork filling.",
        sizes: [
          { sizeKg: 0.5, price: 14.0 },
          { sizeKg: 0.8, price: 20.0 }
        ],
        active: true
      },
      {
        id: crypto.randomUUID(),
        name: "Beef Khinkali",
        description: "All-beef filling, peppered and aromatic.",
        sizes: [
          { sizeKg: 0.5, price: 15.0 },
          { sizeKg: 0.8, price: 22.0 }
        ],
        active: true
      },
      {
        id: crypto.randomUUID(),
        name: "Cheese Khinkali",
        description: "Suluguni cheese filling, rich and creamy.",
        sizes: [
          { sizeKg: 0.5, price: 13.0 },
          { sizeKg: 0.8, price: 19.0 }
        ],
        active: true
      },
      {
        id: crypto.randomUUID(),
        name: "Mushroom Khinkali",
        description: "Savory mushroom filling with herbs (vegetarian).",
        sizes: [
          { sizeKg: 0.5, price: 13.0 },
          { sizeKg: 0.8, price: 19.0 }
        ],
        active: true
      }
    ];
    fs.writeFileSync(productsFile, JSON.stringify(seedProducts, null, 2), "utf8");
  }
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([], null, 2), "utf8");
  }
}

function readJson(filePath) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw || "null");
  } catch (e) {
    return null;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

// Products
export function getProducts() {
  ensureSeedData();
  return readJson(productsFile) || [];
}

export function saveProducts(products) {
  writeJson(productsFile, products);
}

// Orders
export function getOrders() {
  ensureSeedData();
  return readJson(ordersFile) || [];
}

export function saveOrders(orders) {
  writeJson(ordersFile, orders);
}


