import { z } from "zod";

const statusEnum = z.enum(["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED"]);

export const applyToInternshipSchema = z.object({
  body: z.object({
    internshipId: z.string().uuid("Invalid internship id"),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: statusEnum,
  }),
});
