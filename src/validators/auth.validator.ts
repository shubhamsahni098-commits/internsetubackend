import { z } from "zod";

// Mirrors the fields on src/Pages/Register.jsx
export const studentRegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name is too short"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(7).max(20).optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const studentLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

// Mirrors the fields on src/Company/CompRegister.jsx
export const companyRegisterSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name is too short"),
    officialEmail: z.string().email("Invalid email address"),
    phone: z.string().min(7).max(20),
    website: z.string().url().optional().or(z.literal("")),
    industry: z.string().min(1, "Industry is required"),
    location: z.string().min(2, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const companyLoginSchema = z.object({
  body: z.object({
    officialEmail: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});
