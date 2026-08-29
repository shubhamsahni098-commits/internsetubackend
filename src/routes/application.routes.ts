import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  applyToInternshipSchema,
  updateApplicationStatusSchema,
} from "../validators/application.validator";
import * as applicationController from "../controllers/application.controller";

const router = Router();

router.use(requireAuth);

// ---- Student ----
router.post(
  "/",
  requireRole("STUDENT"),
  validate(applyToInternshipSchema),
  applicationController.applyToInternship
);
router.get("/mine", requireRole("STUDENT"), applicationController.getMyApplications);

// ---- Company ----
router.get(
  "/internship/:internshipId",
  requireRole("COMPANY"),
  applicationController.getApplicationsForInternship
);
router.patch(
  "/:id/status",
  requireRole("COMPANY"),
  validate(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

export default router;
