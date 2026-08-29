import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as internshipService from "../services/internship.service";

export const createInternship = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const internship = await internshipService.createInternship(req.user.id, req.body);
  sendSuccess(res, 201, "Internship posted successfully", internship);
});

export const listInternships = asyncHandler(async (req: Request, res: Response) => {
  const result = await internshipService.listInternships(req.query as any);
  sendSuccess(res, 200, "Internships fetched", result);
});

export const getInternshipById = asyncHandler(async (req: Request, res: Response) => {
  const internship = await internshipService.getInternshipById(req.params.id);
  sendSuccess(res, 200, "Internship fetched", internship);
});

export const listMyInternships = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const internships = await internshipService.listCompanyInternships(req.user.id);
  sendSuccess(res, 200, "Your internship postings fetched", internships);
});

export const updateInternship = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const internship = await internshipService.updateInternship(
    req.params.id,
    req.user.id,
    req.body
  );
  sendSuccess(res, 200, "Internship updated successfully", internship);
});

export const deleteInternship = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await internshipService.deleteInternship(req.params.id, req.user.id);
  sendSuccess(res, 200, "Internship deleted successfully");
});
