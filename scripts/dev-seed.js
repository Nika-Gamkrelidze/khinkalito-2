// One-off seed to create a product and size for local testing
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const product = await prisma.product.create({
      data: {
        name: { en: "Test Khinkali", ka: "ტესტ ხინკალი" },
        description: { en: "Test product for payments", ka: "ტესტ პროდუქტი" },
        image: null,
        active: true,
      },
    });
    await prisma.productSize.create({
      data: { productId: product.id, sizeKg: 1, price: 1000 },
    });
    console.log(JSON.stringify({ productId: product.id, sizeKg: 1 }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


