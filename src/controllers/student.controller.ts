import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as studentService from "../services/student.service";

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const student = await studentService.getStudentProfile(req.user.id);
  sendSuccess(res, 200, "Profile fetched", student);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const student = await studentService.updateStudentProfile(req.user.id, req.body);
  sendSuccess(res, 200, "Profile updated successfully", student);
});

export const getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const preferences = await studentService.getStudentPreferences(req.user.id);
  sendSuccess(res, 200, "Preferences fetched", preferences);
});

export const updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const preferences = await studentService.updateStudentPreferences(req.user.id, req.body);
  sendSuccess(res, 200, "Preferences updated successfully", preferences);
});
