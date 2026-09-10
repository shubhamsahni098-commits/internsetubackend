const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(
    "UPDATE internships SET stipend = SUBSTRING(stipend, 5) WHERE stipend LIKE '??? %';"
  );

  console.log("Rows updated:", result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
