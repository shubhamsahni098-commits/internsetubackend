import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

import * as feedbackService from "../services/feedback.service";


export const submitFeedback = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const feedback =
      await feedbackService.submitFeedback(
        req.user.id,
        req.body
      );

    sendSuccess(
      res,
      200,
      "Feedback submitted successfully",
      feedback
    );
  }
);