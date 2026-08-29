import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as companyService from "../services/company.service";

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const company = await companyService.getCompanyProfile(req.user.id);
  sendSuccess(res, 200, "Profile fetched", company);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const company = await companyService.updateCompanyProfile(req.user.id, req.body);
  sendSuccess(res, 200, "Profile updated successfully", company);
});

// Public - lets a student view basic company info from an internship detail page
export const getCompanyPublicInfo = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.getCompanyPublicInfo(req.params.id);
  sendSuccess(res, 200, "Company info fetched", company);
});
