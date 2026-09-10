import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  updateStudentProfileSchema,
  updateStudentPreferencesSchema,
} from "../validators/student.validator";
import * as studentController from "../controllers/student.controller";
import { uploadResume } from "../config/upload";

const router = Router();

router.use(requireAuth, requireRole("STUDENT"));

router.get("/profile", studentController.getMyProfile);

router.put(
  "/profile",
  validate(updateStudentProfileSchema),
  studentController.updateMyProfile
);

router.post(
  "/profile/resume",
  uploadResume.single("resume"),
  studentController.uploadResume
);

router.get("/preferences", studentController.getMyPreferences);

router.put(
  "/preferences",
  validate(updateStudentPreferencesSchema),
  studentController.updateMyPreferences
);

export default router;