const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Reseeding database after schema upgrade...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Shop
  const shop = await prisma.shop.upsert({
    where: { email: "shop@example.com" },
    update: {},
    create: {
      name: "BILLIQ Premium Shop",
      email: "shop@example.com",
      phone: "9999999999",
      password: hashedPassword
    }
  });
  console.log("✅ Shop created: shop@example.com / password123");

  // 2. Create Customer (The user's account)
  const customer = await prisma.customer.upsert({
    where: { phone: "8848258969" },
    update: { 
      password: hashedPassword,
      email: "adelmuhammed786@gmail.com"
    },
    create: {
      phone: "8848258969",
      email: "adelmuhammed786@gmail.com",
      password: hashedPassword
    }
  });
  console.log("✅ Customer created: 8848258969 / adelmuhammed786@gmail.com / password123");

  // 3. Create initial bills to restore intelligence
  const bills = [
    { name: "Coffee", price: 120, qty: 1, cat: "Food & Dining", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { name: "Groceries", price: 980, qty: 1, cat: "Grocery", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { name: "Medicine", price: 685, qty: 1, cat: "Medical", date: new Date() },
  ];

  for (const b of bills) {
    await prisma.bill.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        total: b.price * b.qty,
        category: b.cat,
        createdAt: b.date,
        items: {
          create: [{ name: b.name, price: b.price, quantity: b.qty }]
        }
      }
    });
  }
  console.log("✅ Intelligence baseline restored with 3 bills.");
  console.log("🚀 You can now log in!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
