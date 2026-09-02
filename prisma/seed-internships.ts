import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();


// ============================================================
// Load CSV
// ============================================================

const csvPath = path.join(
  process.cwd(),
  "../data/internships.csv"
);

const csvContent = fs.readFileSync(
  csvPath,
  "utf-8"
);

const rows: Record<string, string>[] = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true
});

console.log("CSV rows found:", rows.length);

if (rows.length === 0) {
  throw new Error("CSV file is empty.");
}


// ============================================================
// Deadline Parser
// ============================================================

function parseDeadline(
  dateText: string
): Date | null {

  if (!dateText) {
    return null;
  }

  const cleaned = dateText
    .trim()
    .replace(/'/g, "")
    .replace(/\s+/g, " ");

  // Format:
  // 11 Oct 25
  const singleDateMatch = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/
  );

  if (singleDateMatch) {

    const day = Number(singleDateMatch[1]);
    const monthText = singleDateMatch[2];
    const year = 2000 + Number(singleDateMatch[3]);

    return createValidDate(
      day,
      monthText,
      year
    );
  }


  // Format:
  // 1 Dec - 31 Dec 25
  const rangeMatch = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s*-\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/
  );

  if (rangeMatch) {

    const endDay = Number(rangeMatch[3]);
    const endMonthText = rangeMatch[4];
    const year = 2000 + Number(rangeMatch[5]);

    // Use the end date of the application window
    return createValidDate(
      endDay,
      endMonthText,
      year
    );
  }


  // Not Available / unknown
  return null;
}


// ============================================================
// Create Valid Date
// ============================================================

function createValidDate(
  day: number,
  monthText: string,
  year: number
): Date | null {

  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  };

  const month = monthMap[monthText];

  if (month === undefined) {
    return null;
  }

  const date = new Date(
    year,
    month,
    day
  );

  // Validate date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}


// ============================================================
// Work Mode Parser
// ============================================================

function parseWorkMode(
  mode: string
): "ON_SITE" | "HYBRID" | "REMOTE" {

  const normalized = (mode || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "remote" ||
    normalized === "work from home"
  ) {
    return "REMOTE";
  }

  if (normalized === "hybrid") {
    return "HYBRID";
  }

  return "ON_SITE";
}


// ============================================================
// Main
// ============================================================

async function main() {

  console.log("\n================================");
  console.log("INTERNSHIP DATABASE IMPORT");
  console.log("================================");


  // ==========================================================
  // Create / Find Companies
  // ==========================================================

  console.log("\nCreating / finding companies...");

  const uniqueCompanies = [
    ...new Set(
      rows
        .map((row) => row.company?.trim())
        .filter(
          (company): company is string =>
            Boolean(company)
        )
    )
  ];

  const companyMap = new Map<string, string>();

  for (const companyName of uniqueCompanies) {

    const emailPrefix = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40);

    const officialEmail =
      `${emailPrefix}@internsetu.local`;

    let company =
      await prisma.company.findUnique({
        where: {
          officialEmail
        }
      });

    if (!company) {

      company =
        await prisma.company.create({
          data: {
            companyName,
            officialEmail,
            password: "demo-password",
            isVerified: true
          }
        });
    }

    companyMap.set(
      companyName,
      company.id
    );
  }

  console.log(
    `Companies available: ${companyMap.size}`
  );


  // ==========================================================
  // Import Internships
  // ==========================================================

  console.log("\nImporting internships...");

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;


  for (const row of rows) {

    const internshipId =
      row.internship_id?.trim();

    const companyName =
      row.company?.trim();

    if (!internshipId) {

      console.log(
        "Skipping row: missing internship_id"
      );

      skippedCount++;
      continue;
    }

    if (!companyName) {

      console.log(
        `Skipping ${internshipId}: missing company`
      );

      skippedCount++;
      continue;
    }


    // --------------------------------------------------------
    // Company ID
    // --------------------------------------------------------

    const companyId =
      companyMap.get(companyName);

    if (!companyId) {

      console.log(
        `Skipping ${internshipId}: company not found`
      );

      skippedCount++;
      continue;
    }


    // --------------------------------------------------------
    // Deadline
    // --------------------------------------------------------

    const deadline =
      parseDeadline(
        row["Apply by Date"]
      );


    // --------------------------------------------------------
    // Work Mode
    // --------------------------------------------------------

    const workMode =
      parseWorkMode(
        row.work_mode
      );


    // --------------------------------------------------------
    // Skills
    // --------------------------------------------------------

    const skills =
      row.Skills
        ? row.Skills
            .split(",")
            .map(
              (skill) => skill.trim()
            )
            .filter(Boolean)
        : [];


    // --------------------------------------------------------
    // Internship Data
    // --------------------------------------------------------

    const internshipData = {

      title:
        row.profile?.trim()
        || "Internship",

      description:
        row.Description?.trim()
        || "",

      domain:
        row.domain?.trim()
        || "Unknown",

      internshipType:
        row.internship_type?.trim()
        || "Technical",

      skills,

      location:
        row.Location?.trim()
        || "Unknown",

      workMode,

      stipend:
        row.Stipend?.trim()
        || null,

      duration:
        row.Duration?.trim()
        || "",

      eligibility:
        row.Eligibility?.trim()
        || "",

      deadline,

      applicationLink:
        null,

      isActive:
        true,

      companyId
    };


    // --------------------------------------------------------
    // Upsert Internship
    // --------------------------------------------------------

    const existing =
      await prisma.internship.findUnique({
        where: {
          id: internshipId
        }
      });


    if (existing) {

      await prisma.internship.update({
        where: {
          id: internshipId
        },
        data: internshipData
      });

      updatedCount++;

    } else {

      await prisma.internship.create({
        data: {
          id: internshipId,
          ...internshipData
        }
      });

      createdCount++;
    }
  }


  // ==========================================================
  // Final Summary
  // ==========================================================

  console.log("\n================================");
  console.log("IMPORT COMPLETE");
  console.log("================================");

  console.log(
    `Created internships: ${createdCount}`
  );

  console.log(
    `Updated internships: ${updatedCount}`
  );

  console.log(
    `Skipped internships: ${skippedCount}`
  );

  console.log(
    `Total CSV rows: ${rows.length}`
  );


  // ==========================================================
  // Verify Database
  // ==========================================================

  const totalCompanies =
    await prisma.company.count();

  const totalInternships =
    await prisma.internship.count();


  console.log("\nDatabase totals:");

  console.log(
    `Companies: ${totalCompanies}`
  );

  console.log(
    `Internships: ${totalInternships}`
  );


  if (
    totalInternships === rows.length
  ) {

    console.log(
      "\n✅ All CSV internships imported successfully."
    );

  } else {

    console.log(
      "\n⚠️ Database count does not match CSV row count."
    );
  }
}


// ============================================================
// Run
// ============================================================

main()
  .catch((error) => {

    console.error(
      "\n❌ Database import failed:"
    );

    console.error(error);

    process.exit(1);

  })
  .finally(async () => {

    await prisma.$disconnect();

  });