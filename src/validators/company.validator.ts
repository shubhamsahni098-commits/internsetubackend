import { z } from "zod";

export const updateCompanyProfileSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).optional(),
    phone: z.string().min(7).max(20).optional(),
    website: z.string().url().optional().or(z.literal("")),
    industry: z.string().optional(),
    location: z.string().optional(),
  }),
});
