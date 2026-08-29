import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigins, // e.g. Vite dev server + the deployed Vercel frontend
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ---- Routes ----
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "InternSetu API is running" });
});

// ---- 404 + error handling (must be last) ----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
