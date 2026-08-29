import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";

const studentPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  location: true,
  education: true,
  preferredRole: true,
  preferredLocation: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
};

export async function getStudentProfile(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: studentPublicSelect,
  });
  if (!student) throw ApiError.notFound("Student not found");
  return student;
}

interface UpdateStudentInput {
  fullName?: string;
  location?: string;
  education?: string;
  preferredRole?: string;
  preferredLocation?: string;
  skills?: string[];
}

export async function updateStudentProfile(id: string, input: UpdateStudentInput) {
  const student = await prisma.student.update({
    where: { id },
    data: input,
    select: studentPublicSelect,
  });
  return student;
}

interface UpdateStudentPreferencesInput {
  internshipType?: string;
  workMode?: string;
  preferredCity?: string;
  locationPreference?: string;
  domains?: string[];
  stipendPreference?: string;
  duration?: string;
  availability?: string[];
}

export async function getStudentPreferences(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: { preferences: true },
  });
  if (!student) throw ApiError.notFound("Student not found");
  return student.preferences ?? {};
}

export async function updateStudentPreferences(
  id: string,
  input: UpdateStudentPreferencesInput
) {
  const student = await prisma.student.update({
    where: { id },
    data: { preferences: input as Prisma.InputJsonValue  },
    select: { preferences: true },
  });
  return student.preferences;
}
