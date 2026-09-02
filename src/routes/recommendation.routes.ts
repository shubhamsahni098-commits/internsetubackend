import { Router } from "express";

import {
  getRecommendations,
} from "../controllers/recommendation.controller";

import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(
  requireAuth,
  requireRole("STUDENT")
);

router.post(
  "/",
  getRecommendations
);

export default router;