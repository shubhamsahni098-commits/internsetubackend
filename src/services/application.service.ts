import { ApplicationStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export async function applyToInternship(studentId: string, internshipId: string) {
  const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
  if (!internship || !internship.isActive) {
    throw ApiError.notFound("Internship not found or no longer accepting applications");
  }

  const existing = await prisma.application.findUnique({
    where: { studentId_internshipId: { studentId, internshipId } },
  });
  if (existing) throw ApiError.conflict("You have already applied to this internship");

  return prisma.application.create({
    data: { studentId, internshipId },
    include: {
      internship: { select: { id: true, title: true, company: { select: { companyName: true } } } },
    },
  });
}

// Student's own applications list, plus the stat counts the Applications.jsx page shows.
export async function getStudentApplications(studentId: string) {
  const applications = await prisma.application.findMany({
    where: { studentId },
    orderBy: { appliedAt: "desc" },
    include: {
      internship: {
        select: {
          id: true,
          title: true,
          location: true,
          domain: true,
          duration: true,
          company: { select: { id: true, companyName: true } },
        },
      },
    },
  });

  const stats = {
    total: applications.length,
    underReview: applications.filter((a) => a.status === "UNDER_REVIEW").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return { applications, stats };
}

// Company viewing everyone who applied to one of its internship postings.
export async function getApplicationsForInternship(internshipId: string, companyId: string) {
  const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
  if (!internship) throw ApiError.notFound("Internship not found");
  if (internship.companyId !== companyId) {
    throw ApiError.forbidden("You do not own this internship posting");
  }

  return prisma.application.findMany({
    where: { internshipId },
    orderBy: { appliedAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          education: true,
          skills: true,
        },
      },
    },
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  companyId: string,
  status: ApplicationStatus
) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { internship: true },
  });
  if (!application) throw ApiError.notFound("Application not found");
  if (application.internship.companyId !== companyId) {
    throw ApiError.forbidden("You do not own the internship this application is for");
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });
}
