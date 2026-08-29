import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createInternshipSchema,
  updateInternshipSchema,
  listInternshipsQuerySchema,
} from "../validators/internship.validator";
import * as internshipController from "../controllers/internship.controller";

const router = Router();

// ---- Public (student-facing browse & detail) ----
router.get("/", validate(listInternshipsQuerySchema), internshipController.listInternships);

// ---- Company-only ----
// NOTE: this must be registered before "/:id" or Express will treat "mine" as an :id param
router.get(
  "/mine",
  requireAuth,
  requireRole("COMPANY"),
  internshipController.listMyInternships
);

router.get("/:id", internshipController.getInternshipById);

router.post(
  "/",
  requireAuth,
  requireRole("COMPANY"),
  validate(createInternshipSchema),
  internshipController.createInternship
);

router.put(
  "/:id",
  requireAuth,
  requireRole("COMPANY"),
  validate(updateInternshipSchema),
  internshipController.updateInternship
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("COMPANY"),
  internshipController.deleteInternship
);

export default router;
