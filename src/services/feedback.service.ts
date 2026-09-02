import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

interface SubmitFeedbackInput {
  internshipId: string;
  feedback: "like" | "dislike";
}

export async function submitFeedback(
  studentId: string,
  input: SubmitFeedbackInput
) {
  // ----------------------------------------------------------
  // 1. Validate feedback value
  // ----------------------------------------------------------

  if (
    input.feedback !== "like" &&
    input.feedback !== "dislike"
  ) {
    throw ApiError.badRequest(
      'Feedback must be either "like" or "dislike"'
    );
  }

  // ----------------------------------------------------------
  // 2. Check internship exists
  // ----------------------------------------------------------

  const internship =
    await prisma.internship.findUnique({
      where: {
        id: input.internshipId,
      },
      select: {
        id: true,
        title: true,
        domain: true,
      },
    });

  if (!internship) {
    throw ApiError.notFound(
      "Internship not found"
    );
  }

  // ----------------------------------------------------------
  // 3. Create or update feedback
  // ----------------------------------------------------------

  const feedback =
    await prisma.feedback.upsert({
      where: {
        studentId_internshipId: {
          studentId,
          internshipId: input.internshipId,
        },
      },

      create: {
        studentId,
        internshipId: input.internshipId,
        feedback: input.feedback,
      },

      update: {
        feedback: input.feedback,
      },
    });

  // ----------------------------------------------------------
  // 4. Return useful feedback data
  // ----------------------------------------------------------

  return {
    id: feedback.id,
    studentId: feedback.studentId,
    internshipId: feedback.internshipId,
    feedback: feedback.feedback,
    internship: {
      id: internship.id,
      title: internship.title,
      domain: internship.domain,
    },
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
  };
}


// ============================================================
// Get student's feedback history
// ============================================================

export async function getFeedbackHistory(
  studentId: string
) {
  return prisma.feedback.findMany({
    where: {
      studentId,
    },

    include: {
      internship: {
        select: {
          id: true,
          title: true,
          domain: true,
        },
      },
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
}