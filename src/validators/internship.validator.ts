import { z } from "zod";

const workModeEnum = z.enum(["ON_SITE", "HYBRID", "REMOTE"]);

// Mirrors src/Company/PostInternship.jsx exactly
export const createInternshipSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title is too short"),
    description: z.string().min(10, "Description is too short"),
    domain: z.string().min(1, "Domain is required"),
    // frontend sends "Python, SQL, Machine Learning" - comma-separated string
    skills: z
      .string()
      .min(1, "At least one skill is required")
      .transform((s) => s.split(",").map((skill) => skill.trim()).filter(Boolean)),
    location: z.string().min(1, "Location is required"),
    workMode: workModeEnum,
    stipend: z.string().optional(),
    duration: z.string().min(1, "Duration is required"),
    eligibility: z.string().min(1, "Eligibility is required"),
    deadline: z.coerce.date({ errorMap: () => ({ message: "Invalid deadline date" }) }),
    applicationLink: z.string().url().optional().or(z.literal("")),
  }),
});

export const updateInternshipSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    domain: z.string().optional(),
    skills: z
      .union([z.string(), z.array(z.string())])
      .transform((s) =>
        Array.isArray(s) ? s : s.split(",").map((skill) => skill.trim()).filter(Boolean)
      )
      .optional(),
    location: z.string().optional(),
    workMode: workModeEnum.optional(),
    stipend: z.string().optional(),
    duration: z.string().optional(),
    eligibility: z.string().optional(),
    deadline: z.coerce.date().optional(),
    applicationLink: z.string().url().optional().or(z.literal("")),
    isActive: z.boolean().optional(),
  }),
});

export const listInternshipsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    domain: z.string().optional(),
    location: z.string().optional(),
    workMode: workModeEnum.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
