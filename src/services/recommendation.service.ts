import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";


// ============================================================
// Get Recommendations
// ============================================================

export async function getRecommendations(
  studentId: string
) {

  // ----------------------------------------------------------
  // 1. Fetch current student
  // ----------------------------------------------------------

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }


  // ----------------------------------------------------------
  // 2. Fetch all active internships
  // ----------------------------------------------------------

  const internships = await prisma.internship.findMany({
    where: {
      isActive: true,
    },

    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          location: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });


  // ----------------------------------------------------------
  // 3. Fetch student's feedback history
  // ----------------------------------------------------------

  const feedbackRecords =
    await prisma.feedback.findMany({
      where: {
        studentId,
      },

      include: {
        internship: {
          select: {
            id: true,
            title: true,
            domain: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });


  // ----------------------------------------------------------
  // 4. Prepare feedback history for Python
  // ----------------------------------------------------------

  const feedbackHistory =
    feedbackRecords.map((record) => ({
      student_id: record.studentId,

      internship_id: record.internshipId,

      feedback: record.feedback,

      domain:
        record.internship.domain,

      role:
        record.internship.title,
    }));


  // ----------------------------------------------------------
  // 5. Prepare student data for Python
  // ----------------------------------------------------------

  const studentData = {
    id: student.id,

    fullName: student.fullName,

    email: student.email,

    phone: student.phone,

    location: student.location,

    education: student.education,

    preferredRole:
      student.preferredRole,

    preferredLocation:
      student.preferredLocation,

    skills: student.skills,

    preferences:
      student.preferences ?? {},
  };


  // ----------------------------------------------------------
  // 6. Prepare internship data for Python
  // ----------------------------------------------------------

  const internshipData =
    internships.map((internship) => ({
      id: internship.id,

      title: internship.title,

      description:
        internship.description,

      domain:
        internship.domain,

      skills:
        internship.skills,

      location:
        internship.location,

      workMode:
        internship.workMode,

      stipend:
        internship.stipend,

      duration:
        internship.duration,

      eligibility:
        internship.eligibility,

      deadline:
        internship.deadline,

      applicationLink:
        internship.applicationLink,

      internshipType:
        internship.internshipType,

      isActive:
        internship.isActive,

      company:
        internship.company
          ? {
              id:
                internship.company.id,

              companyName:
                internship.company.companyName,

              location:
                internship.company.location,
            }
          : null,
    }));


  // ----------------------------------------------------------
  // 7. Call Python recommendation service
  // ----------------------------------------------------------

  let pythonResponse: Response;

  try {

    pythonResponse = await fetch(
      "https://shubhamsahni098-commits--internsetu-recommendation-recom-9ef42d.modal.run/recommend",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          student:
            studentData,

          internships:
            internshipData,

          feedback_history:
            feedbackHistory,
        }),
      }
    );

  } catch (error) {

    console.error(
      "Python recommendation service is unreachable:",
      error
    );

    throw new Error(
      "Recommendation engine is not running on port 8000."
    );
  }


  // ----------------------------------------------------------
  // 8. Handle Python errors
  // ----------------------------------------------------------

  if (!pythonResponse.ok) {

    const errorText =
      await pythonResponse.text();

    console.error(
      "Python recommendation error:",
      errorText
    );

    throw new Error(
      "Recommendation engine failed."
    );
  }


  // ----------------------------------------------------------
  // 9. Read Python response
  // ----------------------------------------------------------

  const pythonData =
    await pythonResponse.json();


  // ----------------------------------------------------------
  // 10. Return recommendations
  // ----------------------------------------------------------

  return pythonData;
}