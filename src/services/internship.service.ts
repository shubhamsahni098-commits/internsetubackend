import { Prisma, WorkMode } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";


// ============================================================
// Create Internship
// ============================================================

interface CreateInternshipInput {
  title: string;
  description: string;
  domain: string;
  internshipType: string;
  skills: string[];
  location: string;
  workMode: WorkMode;
  stipend?: string;
  duration: string;
  eligibility: string;
  deadline: Date;
  applicationLink?: string;
}


export async function createInternship(
  companyId: string,
  input: CreateInternshipInput
) {
  return prisma.internship.create({
    data: {
      ...input,
      companyId
    }
  });
}


// ============================================================
// Public Internship Listing
// ============================================================

interface ListFilters {
  search?: string;
  domain?: string;
  location?: string;
  workMode?: WorkMode;
  page?: number;
  limit?: number;
}


export async function listInternships(
  filters: ListFilters
) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const where: Prisma.InternshipWhereInput = {
    isActive: true,

    ...(filters.domain
      ? {
          domain: filters.domain
        }
      : {}),

    ...(filters.location
      ? {
          location: {
            contains: filters.location
          }
        }
      : {}),

    ...(filters.workMode
      ? {
          workMode: filters.workMode
        }
      : {}),

    ...(filters.search
      ? {
          OR: [
            {
              title: {
                contains: filters.search
              }
            },
            {
              description: {
                contains: filters.search
              }
            }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([

    prisma.internship.findMany({
      where,

      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            location: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      },

      skip: (page - 1) * limit,
      take: limit
    }),

    prisma.internship.count({
      where
    })

  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(
      total / limit
    )
  };
}


// ============================================================
// NEW: Fetch All Active Internships for Recommendation
// ============================================================

export async function getAllActiveInternshipsForRecommendation() {

  return prisma.internship.findMany({

    where: {
      isActive: true
    },

    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          location: true
        }
      }
    },

    orderBy: {
      createdAt: "desc"
    }
  });
}


// ============================================================
// Get Internship by ID
// ============================================================

export async function getInternshipById(
  id: string
) {

  const internship =
    await prisma.internship.findUnique({

      where: {
        id
      },

      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            location: true,
            website: true
          }
        }
      }
    });

  if (!internship) {
    throw ApiError.notFound(
      "Internship not found"
    );
  }

  return internship;
}


// ============================================================
// List Company's Internships
// ============================================================

export async function listCompanyInternships(
  companyId: string
) {

  return prisma.internship.findMany({

    where: {
      companyId
    },

    orderBy: {
      createdAt: "desc"
    },

    include: {
      _count: {
        select: {
          applications: true
        }
      }
    }
  });
}


// ============================================================
// Check Internship Ownership
// ============================================================

async function assertOwnership(
  internshipId: string,
  companyId: string
) {

  const internship =
    await prisma.internship.findUnique({

      where: {
        id: internshipId
      }
    });

  if (!internship) {
    throw ApiError.notFound(
      "Internship not found"
    );
  }

  if (internship.companyId !== companyId) {
    throw ApiError.forbidden(
      "You do not own this internship posting"
    );
  }

  return internship;
}


// ============================================================
// Update Internship
// ============================================================

export async function updateInternship(

  internshipId: string,

  companyId: string,

  input:
    Partial<CreateInternshipInput> & {
      isActive?: boolean
    }

) {

  await assertOwnership(
    internshipId,
    companyId
  );

  return prisma.internship.update({

    where: {
      id: internshipId
    },

    data: input
  });
}


// ============================================================
// Delete Internship
// ============================================================

export async function deleteInternship(

  internshipId: string,

  companyId: string

) {

  await assertOwnership(
    internshipId,
    companyId
  );

  await prisma.internship.delete({

    where: {
      id: internshipId
    }

  });

}