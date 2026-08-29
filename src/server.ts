import app from "./app";
import { env } from "./config/env";
import prisma from "./config/prisma";

async function main() {
  // Fail fast if the database is unreachable, instead of accepting requests
  // that will all error out on their first query.
  await prisma.$connect();
  console.log("Connected to MySQL via Prisma");

  app.listen(env.port, () => {
    console.log(`InternSetu API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
