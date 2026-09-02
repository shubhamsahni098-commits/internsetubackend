import { PrismaClient, WorkMode, ApplicationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "password123"; // same password for every seeded account, for easy testing

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Remote"];

const DOMAINS = [
  "Software Development",
  "Artificial Intelligence",
  "Data Science",
  "Web Development",
  "Cyber Security",
  "UI/UX",
  "Marketing",
  "Finance",
];

const SKILL_POOL = [
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "Java",
  "C++",
  "Machine Learning",
  "TensorFlow",
  "Power BI",
  "Excel",
  "Figma",
  "AWS",
  "Docker",
  "MongoDB",
  "TypeScript",
];

const ROLES = [
  "Software Developer",
  "Data Analyst",
  "Data Scientist",
  "AI / ML Engineer",
  "Web Developer",
  "Backend Developer",
];

const INDUSTRIES = [
  "IT",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Government",
  "Other",
];

const WORK_MODES: WorkMode[] = [
  "ON_SITE",
  "HYBRID",
  "REMOTE",
];

const DURATIONS = [
  "1 Month",
  "2 Months",
  "3 Months",
  "6 Months",
  "12 Months",
];

const STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "REJECTED",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  return [...arr]
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
}

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash(
    DEFAULT_PASSWORD,
    10
  );

  // Clear existing data
  await prisma.application.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.student.deleteMany();
  await prisma.company.deleteMany();

  // ==========================================================
  // Students
  // ==========================================================

  const students = [];

  for (let i = 1; i <= 30; i++) {
    const student = await prisma.student.create({
      data: {
        fullName: `Student Test ${i}`,
        email: `student${i}@test.com`,
        phone: `+91 90000${String(i).padStart(5, "0")}`,
        password: hashedPassword,
        location: pick(CITIES),
        education: "B.Tech Computer Science",
        preferredRole: pick(ROLES),
        preferredLocation: pick(CITIES),
        skills: pickMany(SKILL_POOL, 4),
      },
    });

    students.push(student);
  }

  console.log(
    `Created ${students.length} students`
  );

  // ==========================================================
  // Companies
  // ==========================================================

  const companies = [];

  for (let i = 1; i <= 60; i++) {
    const company = await prisma.company.create({
      data: {
        companyName: `Company Test ${i}`,
        officialEmail: `company${i}@test.com`,
        phone: `+91 80000${String(i).padStart(5, "0")}`,
        password: hashedPassword,
        website: `https://company${i}.example.com`,
        industry: pick(INDUSTRIES),
        location: pick(CITIES),
        isVerified: true,
      },
    });

    companies.push(company);
  }

  console.log(
    `Created ${companies.length} companies`
  );

  // ==========================================================
  // Internships
  // ==========================================================

  const internships = [];

  for (const company of companies) {
    const count = 1 + Math.round(Math.random());

    for (let j = 0; j < count; j++) {
      const deadline = new Date();

      deadline.setDate(
        deadline.getDate() +
          15 +
          Math.floor(Math.random() * 45)
      );

      const internship = await prisma.internship.create({
        data: {
          title: `${pick(ROLES)} Intern`,

          description:
            "Work closely with our team on real projects, gaining hands-on experience and mentorship throughout the internship.",

          domain: pick(DOMAINS),

          // Added because internshipType is now required
          internshipType:
            Math.random() < 0.8
              ? "Technical"
              : "Non-Technical",

          skills: pickMany(
            SKILL_POOL,
            3
          ),

          location: pick(CITIES),

          workMode: pick(WORK_MODES),

          stipend:
            `₹${(8 + Math.floor(Math.random() * 15)) * 1000} / month`,

          duration: pick(DURATIONS),

          eligibility:
            "B.Tech 2nd / 3rd year",

          deadline,

          applicationLink:
            `https://company-${company.id.slice(0, 6)}.example.com/apply`,

          companyId: company.id,
        },
      });

      internships.push(internship);
    }
  }

  console.log(
    `Created ${internships.length} internships`
  );

  // ==========================================================
  // Sample Applications
  // ==========================================================

  let applicationCount = 0;

  for (const student of students) {
    const appliedTo = pickMany(
      internships,
      2 + Math.floor(Math.random() * 3)
    );

    for (const internship of appliedTo) {
      try {
        await prisma.application.create({
          data: {
            studentId: student.id,
            internshipId: internship.id,
            status: pick(STATUSES),
          },
        });

        applicationCount++;
      } catch {
        // Ignore duplicate application errors
      }
    }
  }

  console.log(
    `Created ${applicationCount} applications`
  );

  console.log(
    "\nSeed complete. All seeded accounts use the password:",
    DEFAULT_PASSWORD
  );

  console.log(
    "Example logins: student1@test.com / company1@test.com"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });