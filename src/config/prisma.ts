import { PrismaClient } from "@prisma/client";

// A single shared PrismaClient instance. Creating a new client per request
// exhausts MySQL's connection pool very fast, so we reuse this one everywhere.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
