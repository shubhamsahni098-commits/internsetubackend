import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";

import { sendSuccess } from "../utils/ApiResponse";

import { ApiError } from "../utils/ApiError";

import * as studentService from "../services/student.service";


// ============================================================
// Get My Profile
// ============================================================

export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const student =
      await studentService.getStudentProfile(
        req.user.id
      );

    sendSuccess(
      res,
      200,
      "Profile fetched",
      student
    );
  }
);


// ============================================================
// Update My Profile
// ============================================================

export const updateMyProfile = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const student =
      await studentService.updateStudentProfile(
        req.user.id,
        req.body
      );

    sendSuccess(
      res,
      200,
      "Profile updated successfully",
      student
    );
  }
);


// ============================================================
// Upload Resume
// ============================================================

export const uploadResume = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!req.file) {
      throw ApiError.badRequest(
        "Resume file is required"
      );
    }

    const result =
      await studentService.uploadStudentResume(
        req.user.id,
        req.file
      );

    sendSuccess(
      res,
      200,
      "Resume uploaded and skills extracted successfully",
      result
    );
  }
);


// ============================================================
// Get My Preferences
// ============================================================

export const getMyPreferences = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const preferences =
      await studentService.getStudentPreferences(
        req.user.id
      );

    sendSuccess(
      res,
      200,
      "Preferences fetched",
      preferences
    );
  }
);


// ============================================================
// Update My Preferences
// ============================================================

export const updateMyPreferences = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const preferences =
      await studentService.updateStudentPreferences(
        req.user.id,
        req.body
      );

    sendSuccess(
      res,
      200,
      "Preferences updated successfully",
      preferences
    );
  }
);