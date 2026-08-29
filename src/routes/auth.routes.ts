import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  studentRegisterSchema,
  studentLoginSchema,
  companyRegisterSchema,
  companyLoginSchema,
} from "../validators/auth.validator";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/student/register", validate(studentRegisterSchema), authController.registerStudent);
router.post("/student/login", validate(studentLoginSchema), authController.loginStudent);

router.post("/company/register", validate(companyRegisterSchema), authController.registerCompany);
router.post("/company/login", validate(companyLoginSchema), authController.loginCompany);

// works for either role - reads req.user.role set by requireAuth
router.get("/me", requireAuth, authController.getMe);

export default router;
