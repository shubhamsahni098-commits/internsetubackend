import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as applicationService from "../services/application.service";

export const applyToInternship = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await applicationService.applyToInternship(
    req.user.id,
    req.body.internshipId
  );
  sendSuccess(res, 201, "Application submitted successfully", application);
});

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await applicationService.getStudentApplications(req.user.id);
  sendSuccess(res, 200, "Applications fetched", result);
});

export const getApplicationsForInternship = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const applications = await applicationService.getApplicationsForInternship(
    req.params.internshipId,
    req.user.id
  );
  sendSuccess(res, 200, "Applicants fetched", applications);
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user.id,
    req.body.status
  );
  sendSuccess(res, 200, "Application status updated", application);
});
