import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

import { PDFParse } from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { createCanvas } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";

import mammoth from "mammoth";

import { PREDEFINED_SKILLS } from "../constants/skills.constants";

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
  resumeUrl: true,
  createdAt: true,
  updatedAt: true,
};

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL ||
  "https://shubhamsahni098-commits--internsetu-recommendation-recom-9ef42d.modal.run";

// ============================================================
// Get Student Profile
// ============================================================

export async function getStudentProfile(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    select: studentPublicSelect,
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  return student;
}

// ============================================================
// Update Student Profile
// ============================================================

interface UpdateStudentInput {
  fullName?: string;
  location?: string;
  education?: string;
  preferredRole?: string;
  preferredLocation?: string;
  skills?: string[];
  resumeUrl?: string;
}

export async function updateStudentProfile(
  id: string,
  input: UpdateStudentInput
) {
  const student = await prisma.student.update({
    where: { id },
    data: input,
    select: studentPublicSelect,
  });

  return student;
}

// ============================================================
// Student Preferences
// ============================================================

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

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  return student.preferences ?? {};
}

export async function updateStudentPreferences(
  id: string,
  input: UpdateStudentPreferencesInput
) {
  const student = await prisma.student.update({
    where: { id },
    data: {
      preferences: input as Prisma.InputJsonValue,
    },
    select: { preferences: true },
  });

  return student.preferences;
}

// ============================================================
// PDF TEXT EXTRACTION - PDF.JS
// ============================================================

async function extractPdfTextWithPdfJs(
  fileBuffer: Buffer
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
  });

  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  try {
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);

      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => {
          return "str" in item ? item.str : "";
        })
        .join(" ");

      pages.push(pageText);
    }
  } finally {
    await pdf.destroy();
  }

  return pages.join("\n");
}

// ============================================================
// PDF OCR EXTRACTION - TESSERACT
// ============================================================

async function extractPdfTextWithOcr(
  fileBuffer: Buffer
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
  });

  const pdf = await loadingTask.promise;

  const worker = await createWorker("eng");

  const pages: string[] = [];

  try {
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);

      // Render PDF page as an image
      // Higher scale improves OCR accuracy
      const viewport = page.getViewport({
        scale: 2,
      });

      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );

      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as any,
        viewport,
      }).promise;

      const imageBuffer = canvas.toBuffer("image/png");

      const result = await worker.recognize(
        imageBuffer
      );

      pages.push(result.data.text);
    }
  } finally {
    await worker.terminate();
    await pdf.destroy();
  }

  return pages.join("\n");
}

// ============================================================
// Resume Upload + Skill Extraction
// ============================================================

interface UploadedResumeFile {
  path: string;
  originalname: string;
  mimetype: string;
}

export async function uploadStudentResume(
  studentId: string,
  file: UploadedResumeFile
) {
  if (!file?.path) {
    throw ApiError.badRequest(
      "Resume file is required"
    );
  }

  // ----------------------------------------------------------
  // Validate file extension
  // ----------------------------------------------------------

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (![".pdf", ".docx"].includes(extension)) {
    throw ApiError.badRequest(
      "Only PDF and DOCX files are allowed"
    );
  }

  // ----------------------------------------------------------
  // Extract text from resume
  // ----------------------------------------------------------

  let resumeText = "";

  // ==========================================================
  // PDF
  // ==========================================================

  if (extension === ".pdf") {
    const fileBuffer = await fs.readFile(
      file.path
    );

    // --------------------------------------------------------
    // STEP 1: Try pdf-parse
    // --------------------------------------------------------

    try {
      const parser = new PDFParse({
        data: fileBuffer,
      });

      try {
        const pdfData = await parser.getText();

        resumeText = pdfData.text || "";
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      console.error(
        "pdf-parse extraction failed:",
        error
      );
    }

    // --------------------------------------------------------
    // STEP 2: Try PDF.js
    // --------------------------------------------------------

    if (!resumeText.trim()) {
      try {
        console.log(
          "pdf-parse returned no text. Trying PDF.js..."
        );

        resumeText =
          await extractPdfTextWithPdfJs(
            fileBuffer
          );

        console.log(
          `PDF.js extraction completed. Characters: ${resumeText.length}`
        );
      } catch (error) {
        console.error(
          "PDF.js extraction failed:",
          error
        );
      }
    }

    // --------------------------------------------------------
    // STEP 3: OCR scanned/image PDF
    // --------------------------------------------------------

    if (!resumeText.trim()) {
      try {
        console.log(
          "No PDF text found. Starting OCR..."
        );

        resumeText =
          await extractPdfTextWithOcr(
            fileBuffer
          );

        console.log(
          `OCR extraction completed. Characters: ${resumeText.length}`
        );
      } catch (error) {
        console.error(
          "OCR extraction failed:",
          error
        );
      }
    }
  }

  // ==========================================================
  // DOCX
  // ==========================================================

  if (extension === ".docx") {
    try {
      const result =
        await mammoth.extractRawText({
          path: file.path,
        });

      resumeText = result.value || "";
    } catch (error) {
      console.error(
        "DOCX extraction failed:",
        error
      );
    }
  }

  // ----------------------------------------------------------
  // Final extraction check
  // ----------------------------------------------------------

  if (!resumeText.trim()) {
    throw ApiError.badRequest(
      "Could not extract text from the resume"
    );
  }

  console.log(
    `Resume text extracted successfully. Characters: ${resumeText.length}`
  );

  // ----------------------------------------------------------
  // Get student's existing manually entered skills
  // ----------------------------------------------------------

  const student =
    await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        skills: true,
      },
    });

  if (!student) {
    throw ApiError.notFound(
      "Student not found"
    );
  }

  const existingSkills =
    Array.isArray(student.skills)
      ? student.skills.filter(
          (skill): skill is string =>
            typeof skill === "string"
        )
      : [];

  // ----------------------------------------------------------
  // Send resume text + predefined skills
  // to AI service
  // ----------------------------------------------------------

  let aiResponse: Response;

  try {
    aiResponse = await fetch(
      `${RECOMMENDATION_SERVICE_URL}/extract-resume-skills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          predefined_skills: [
            ...PREDEFINED_SKILLS,
          ],
        }),
      }
    );
  } catch (error) {
    console.error(
      "Resume skill extraction service is unreachable:",
      error
    );

    throw new Error(
      "Resume skill extraction service is not running."
    );
  }

  // ----------------------------------------------------------
  // Check AI service response
  // ----------------------------------------------------------

  if (!aiResponse.ok) {
    const errorText =
      await aiResponse.text();

    console.error(
      "Resume skill extraction error:",
      errorText
    );

    throw new Error(
      "Failed to extract skills from resume."
    );
  }

  // ----------------------------------------------------------
  // Read AI response
  // ----------------------------------------------------------

  const aiData: any =
    await aiResponse.json();

  if (!aiData.success) {
    throw new Error(
      aiData.message ||
        "Failed to extract resume skills."
    );
  }

  // ----------------------------------------------------------
  // Get canonical skills returned by AI
  // ----------------------------------------------------------

  const extractedSkills: string[] =
    Array.isArray(aiData.skills)
      ? aiData.skills.filter(
          (skill: unknown): skill is string =>
            typeof skill === "string"
        )
      : [];

  // ----------------------------------------------------------
  // Merge:
  //
  // Manual Skills
  //       +
  // Resume Extracted Skills
  //       ↓
  // Final Student Skills
  // ----------------------------------------------------------

  const mergedSkills: string[] = [];

  const seenSkills =
    new Set<string>();

  for (const skill of [
    ...existingSkills,
    ...extractedSkills,
  ]) {
    const cleanSkill =
      skill.trim();

    if (!cleanSkill) {
      continue;
    }

    const normalizedSkill =
      cleanSkill.toLowerCase();

    if (
      !seenSkills.has(
        normalizedSkill
      )
    ) {
      seenSkills.add(
        normalizedSkill
      );

      mergedSkills.push(
        cleanSkill
      );
    }
  }

  // ----------------------------------------------------------
  // Resume URL
  // ----------------------------------------------------------

  const resumeUrl =
    `/uploads/resumes/${path.basename(
      file.path
    )}`;

  // ----------------------------------------------------------
  // Save:
  //
  // 1. Resume URL
  // 2. Manual + Resume Skills
  // ----------------------------------------------------------

  const updatedStudent =
    await prisma.student.update({
      where: { id: studentId },

      data: {
        resumeUrl,
        skills: mergedSkills,
      },

      select: studentPublicSelect,
    });

  // ----------------------------------------------------------
  // Return result
  // ----------------------------------------------------------

  return {
    student: updatedStudent,

    resumeUrl,

    extractedSkills,

    skills: mergedSkills,

    skillsSectionFound:
      aiData.skills_section_found ??
      false,

    matchedSkills:
      aiData.matched_skills ?? [],
  };
}