import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as authService from "../services/auth.service";

export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  const { student, token } = await authService.registerStudent(req.body);
  sendSuccess(res, 201, "Student account created successfully", { student, token });
});

export const loginStudent = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { student, token } = await authService.loginStudent(email, password);
  sendSuccess(res, 200, "Logged in successfully", { student, token });
});

export const registerCompany = asyncHandler(async (req: Request, res: Response) => {
  const { company, token } = await authService.registerCompany(req.body);
  sendSuccess(res, 201, "Organization account created successfully", { company, token });
});

export const loginCompany = asyncHandler(async (req: Request, res: Response) => {
  const { officialEmail, password } = req.body;
  const { company, token } = await authService.loginCompany(officialEmail, password);
  sendSuccess(res, 200, "Logged in successfully", { company, token });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getCurrentUser(req.user.id, req.user.role);
  sendSuccess(res, 200, "Current user fetched", user);
});
