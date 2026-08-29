import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateCompanyProfileSchema } from "../validators/company.validator";
import * as companyController from "../controllers/company.controller";

const router = Router();

// Public - anyone (e.g. a student viewing an internship) can see basic company info
router.get("/:id/public", companyController.getCompanyPublicInfo);

router.use(requireAuth, requireRole("COMPANY"));

router.get("/profile", companyController.getMyProfile);
router.put("/profile", validate(updateCompanyProfileSchema), companyController.updateMyProfile);

export default router;
