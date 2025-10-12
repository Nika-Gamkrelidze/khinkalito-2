import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../lib/prisma.js";

async function readJson(relPath) {
  const file = path.join(process.cwd(), relPath);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function seedUsers() {
  const users = await readJson("data/users.json");
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        username: u.username,
        passwordHash: u.passwordHash,
        role: u.role,
        createdAt: new Date(u.createdAt),
      },
    });
  }
}

async function seedProducts() {
  const products = await readJson("data/products.json");
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image || null,
        active: p.active !== false,
      },
    });
    if (Array.isArray(p.sizes)) {
      for (const s of p.sizes) {
        await prisma.productSize.upsert({
          where: { productId_sizeKg: { productId: p.id, sizeKg: s.sizeKg } },
          update: { price: s.price },
          create: { productId: p.id, sizeKg: s.sizeKg, price: s.price },
        });
      }
    }
  }
}

async function seedSettings() {
  const settings = await readJson("data/settings.json");
  const entries = Object.entries(settings);
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

async function seedOrders() {
  const orders = await readJson("data/orders.json");
  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        createdAt: new Date(o.createdAt),
        status: o.status || "pending",
        customer: o.customer,
        address: o.address,
        items: o.items,
        total: o.total,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedProducts();
  await seedSettings();
  await seedOrders();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


