import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const ordersFile = path.join(dataDir, "orders.json");
const settingsFile = path.join(dataDir, "settings.json");
const usersFile = path.join(dataDir, "users.json");
import { hashPassword } from "./auth";

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
        id: randomUUID(),
        name: "Traditional Beef & Pork Khinkali",
        description: "Classic Georgian khinkali with juicy beef-pork filling.",
        image: null,
        sizes: [
          { sizeKg: 0.5, price: 14.0 },
          { sizeKg: 0.8, price: 20.0 }
        ],
        active: true
      },
      {
        id: randomUUID(),
        name: "Beef Khinkali",
        description: "All-beef filling, peppered and aromatic.",
        image: null,
        sizes: [
          { sizeKg: 0.5, price: 15.0 },
          { sizeKg: 0.8, price: 22.0 }
        ],
        active: true
      },
      {
        id: randomUUID(),
        name: "Cheese Khinkali",
        description: "Suluguni cheese filling, rich and creamy.",
        image: null,
        sizes: [
          { sizeKg: 0.5, price: 13.0 },
          { sizeKg: 0.8, price: 19.0 }
        ],
        active: true
      },
      {
        id: randomUUID(),
        name: "Mushroom Khinkali",
        description: "Savory mushroom filling with herbs (vegetarian).",
        image: null,
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
  if (!fs.existsSync(settingsFile)) {
    const defaultSettings = {
      phone: "+995 555 123 456",
      hours: "11:00 - 23:00",
      deliveringUntil: "23:00",
      address: "Tbilisi, Georgia",
      city: "Tbilisi",
      heroImage: null,
      freeDeliveryThreshold: 0,
      workingDays: {
        en: "Mon - Sun",
        ka: "ორშ - კვ"
      },
      ratingValue: "4.9",
      deliveryMinutes: "30-45",
      happyCustomers: "500+",
      heroTitle: {
        en: "Authentic Georgian Khinkali",
        ka: "ავთენტური ქართული ხინკალი"
      },
      heroDesc: {
        en: "Experience the true taste of Georgia with our handcrafted khinkali, made from traditional recipes passed down through generations.",
        ka: "აღმოაჩინე საქართველოს ნამდვილი გემო ჩვენს ხელით დამზადებულ ხინკალებში, თაობიდან თაობაზე გადაცემული რეცეპტებით."
      },
      aboutTitle: {
        en: "Traditional Georgian Cuisine",
        ka: "ქართული ტრადიციული სამზარეულო"
      },
      about1: {
        en: "At Khinkalito, we bring you the authentic taste of Georgia through our handmade khinkali.",
        ka: "ხინკალიტოში ჩვენ გაწვდით საქართველოს ავთენტურ გემოს ხელით დამზადებული ხინკალით."
      },
      menuDesc: {
        en: "Choose from our selection of traditional Georgian dumplings, each prepared with authentic recipes and premium ingredients",
        ka: "აირჩიე ტრადიციული ქართული ხინკლების ასორტიმენტიდან, დამზადებული ავთენტური რეცეპებით და უმაღლესი ხარისხის ინგრედიენტებით"
      },
      completeOrderDesc: {
        en: "Fill in your details and delivery address to receive your delicious khinkali",
        ka: "შეავსე მონაცემები და მისამართი რომ მიიღო გემრიელი ხინკალი"
      }
    };
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2), "utf8");
  }
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = [
      {
        id: randomUUID(),
        username: "admin",
        passwordHash: hashPassword("admin123"),
        role: "admin",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2), "utf8");
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

// Settings
export function getSettings() {
  ensureSeedData();
  return readJson(settingsFile) || {};
}

export function saveSettings(settings) {
  writeJson(settingsFile, settings);
}

// Users
export function getUsers() {
  ensureSeedData();
  return readJson(usersFile) || [];
}

export function saveUsers(users) {
  writeJson(usersFile, users);
}


