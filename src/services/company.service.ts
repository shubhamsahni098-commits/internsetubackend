import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

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
  updatedAt: true,
};

export async function getCompanyProfile(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    select: companyPublicSelect,
  });
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

// Used for the public-facing internship detail page (student side) -
// deliberately excludes officialEmail/phone to avoid exposing contact info.
export async function getCompanyPublicInfo(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      website: true,
      industry: true,
      location: true,
      isVerified: true,
    },
  });
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

interface UpdateCompanyInput {
  companyName?: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
}

export async function updateCompanyProfile(id: string, input: UpdateCompanyInput) {
  return prisma.company.update({
    where: { id },
    data: input,
    select: companyPublicSelect,
  });
}
