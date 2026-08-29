import { z } from "zod";

// Mirrors src/Dashboard/Profile.jsx
export const updateStudentProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    location: z.string().optional(),
    education: z.string().optional(),
    preferredRole: z.string().optional(),
    preferredLocation: z.string().optional(),
    skills: z.array(z.string()).optional(),
  }),
});

// Mirrors src/Dashboard/Preferences.jsx - a separate, more detailed matching-preferences
// page distinct from the basic Profile page above. Kept loose (plain strings/arrays)
// since these are just match-filtering hints, not fields used elsewhere in the system.
export const updateStudentPreferencesSchema = z.object({
  body: z.object({
    internshipType: z.string().optional(),
    workMode: z.string().optional(),
    preferredCity: z.string().optional(),
    locationPreference: z.string().optional(),
    domains: z.array(z.string()).optional(),
    stipendPreference: z.string().optional(),
    duration: z.string().optional(),
    availability: z.array(z.string()).optional(),
  }),
});

