import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  updateStudentProfileSchema,
  updateStudentPreferencesSchema,
} from "../validators/student.validator";
import * as studentController from "../controllers/student.controller";

const router = Router();

router.use(requireAuth, requireRole("STUDENT"));

router.get("/profile", studentController.getMyProfile);
router.put("/profile", validate(updateStudentProfileSchema), studentController.updateMyProfile);

router.get("/preferences", studentController.getMyPreferences);
router.put(
  "/preferences",
  validate(updateStudentPreferencesSchema),
  studentController.updateMyPreferences
);

export default router;
