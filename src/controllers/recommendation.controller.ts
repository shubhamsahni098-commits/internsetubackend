import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";

import { sendSuccess } from "../utils/ApiResponse";

import { ApiError } from "../utils/ApiError";

import * as recommendationService from "../services/recommendation.service";


export const getRecommendations = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const recommendations =
      await recommendationService.getRecommendations(
        req.user.id
      );

    sendSuccess(
      res,
      200,
      "Recommendations generated",
      recommendations
    );
  }
);