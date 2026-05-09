const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bills = await prisma.bill.findMany({
      include: { store: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Success! Found " + bills.length + " bills.");
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
