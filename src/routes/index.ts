import { Router } from "express";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import companyRoutes from "./company.routes";
import internshipRoutes from "./internship.routes";
import applicationRoutes from "./application.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, message: "API is healthy" }));

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/companies", companyRoutes);
router.use("/internships", internshipRoutes);
router.use("/applications", applicationRoutes);

export default router;
