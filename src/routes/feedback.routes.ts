import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../middlewares/auth.middleware";

import {
  submitFeedback,
} from "../controllers/feedback.controller";

const router = Router();

router.use(
  requireAuth,
  requireRole("STUDENT")
);

router.post(
  "/",
  submitFeedback
);

export default router;