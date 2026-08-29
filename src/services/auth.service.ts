import prisma from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

interface StudentRegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

interface CompanyRegisterInput {
  companyName: string;
  officialEmail: string;
  phone: string;
  website?: string;
  industry: string;
  location: string;
  password: string;
}

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
};

const companyPublicSelect = {
  id: true,
  companyName: true,
  officialEmail: true,
  phone: true,
  website: true,
  industry: true,
  location: true,
  isVerified: true,
  createdAt: true,
};

export async function registerStudent(input: StudentRegisterInput) {
  const existing = await prisma.student.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const student = await prisma.student.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      password: await hashPassword(input.password),
    },
    select: studentPublicSelect,
  });

  const token = signToken({ id: student.id, role: "STUDENT" });
  return { student, token };
}

export async function loginStudent(email: string, password: string) {
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(password, student.password);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken({ id: student.id, role: "STUDENT" });
  const { password: _pw, ...safeStudent } = student;
  return { student: safeStudent, token };
}

export async function registerCompany(input: CompanyRegisterInput) {
  const existing = await prisma.company.findUnique({
    where: { officialEmail: input.officialEmail },
  });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const company = await prisma.company.create({
    data: {
      companyName: input.companyName,
      officialEmail: input.officialEmail,
      phone: input.phone,
      website: input.website || undefined,
      industry: input.industry,
      location: input.location,
      password: await hashPassword(input.password),
    },
    select: companyPublicSelect,
  });

  const token = signToken({ id: company.id, role: "COMPANY" });
  return { company, token };
}

export async function loginCompany(officialEmail: string, password: string) {
  const company = await prisma.company.findUnique({ where: { officialEmail } });
  if (!company) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(password, company.password);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const token = signToken({ id: company.id, role: "COMPANY" });
  const { password: _pw, ...safeCompany } = company;
  return { company: safeCompany, token };
}

export async function getCurrentUser(id: string, role: "STUDENT" | "COMPANY") {
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { id },
      select: studentPublicSelect,
    });
    if (!student) throw ApiError.notFound("Student not found");
    return { role, ...student };
  }
  const company = await prisma.company.findUnique({
    where: { id },
    select: companyPublicSelect,
  });
  if (!company) throw ApiError.notFound("Company not found");
  return { role, ...company };
}
