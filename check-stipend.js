const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.internship.findMany({
    where: {
      stipend: {
        startsWith: "??? "
      }
    },
    select: {
      id: true,
      stipend: true
    },
    take: 5
  });

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
