import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

import { PDFParse } from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

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

    if (resumeText.trim().length < 50) {
      try {
        console.log(
          "pdf-parse text insufficient. Trying PDF.js..."
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
  // DEBUG: Verify what the PDF/DOCX parser extracted
  // ----------------------------------------------------------
  console.log("========== RESUME TEXT DEBUG ==========");
  console.log("Resume characters:", resumeText.length);
  console.log(
    "Resume text preview:",
    resumeText.substring(0, 3000)
  );
  console.log("========================================");

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

  console.log("========== AI SKILL RESPONSE DEBUG ==========");
  console.log("AI success:", aiData?.success);
  console.log("AI skills:", aiData?.skills);
  console.log("AI matched_skills:", aiData?.matched_skills);
  console.log(
    "AI skills_section_found:",
    aiData?.skills_section_found
  );
  console.log("==============================================");

  if (!aiData.success) {
    throw new Error(
      aiData.message ||
        "Failed to extract resume skills."
    );
  }

  // ----------------------------------------------------------
  // Get canonical skills returned by AI
  // ----------------------------------------------------------

  const aiExtractedSkills: string[] =
    Array.isArray(aiData.skills)
      ? aiData.skills.filter(
          (skill: unknown): skill is string =>
            typeof skill === "string"
        )
      : [];

  const aiMatchedSkills: string[] =
    Array.isArray(aiData.matched_skills)
      ? aiData.matched_skills.filter(
          (skill: unknown): skill is string =>
            typeof skill === "string"
        )
      : [];

  // ----------------------------------------------------------
  // FALLBACK SKILL EXTRACTION
  //
  // If the AI returns no skills, scan the complete extracted
  // resume text against the canonical predefined skill list.
  // This does not require a "Skills" heading.
  // ----------------------------------------------------------

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/[^\p{L}\p{N}+#./&-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const resumeTextNormalized = normalizeText(resumeText);

  const skillAliases: Record<string, string[]> = {
    "React.js": ["react", "react js", "reactjs"],
    "Node.js": ["node", "node js", "nodejs"],
    "Express.js": ["express", "express js", "expressjs"],
    "Next.js": ["next", "next js", "nextjs"],
    "Vue.js": ["vue", "vue js", "vuejs"],
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "dl"],
    "Artificial intelligence": ["artificial intelligence", "artificial intelligence ai"],
    "TensorFlow": ["tensorflow"],
    "Scikit-learn": ["scikit learn", "scikit-learn", "sklearn"],
    "OpenCV": ["opencv", "open cv"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "c sharp"],
    "TypeScript": ["typescript", "ts"],
    "JavaScript": ["javascript", "java script", "js"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "SQL": ["sql"],
    "MySQL": ["mysql", "my sql"],
    "PostgreSQL": ["postgresql", "postgres", "postgre sql"],
    "MongoDB": ["mongodb", "mongo db", "mongo"],
    "Power BI": ["power bi", "powerbi"],
    "MS-Excel": ["excel", "microsoft excel", "ms excel"],
    "MS-Office": ["ms office", "microsoft office"],
    "MS-PowerPoint": ["powerpoint", "power point", "ms powerpoint"],
    "MS-Word": ["ms word", "microsoft word", "word"],
    "Git": ["git", "github", "gitlab"],
    "REST API": ["rest api", "restful api", "rest apis"],
    "NLP": ["nlp", "natural language processing"],
    "LLM": ["llm", "large language model", "large language models"],
    "RAG": ["rag", "retrieval augmented generation"],
    "Hugging Face": ["hugging face", "huggingface"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "CI/CD": ["ci cd", "cicd", "continuous integration", "continuous deployment"],
    "OOP": ["oop", "object oriented programming", "object-oriented programming"],
    "Data Structures": ["data structures", "data structure", "dsa", "data structures and algorithms"],
    "NumPy": ["numpy", "num py"],
    "Pandas": ["pandas"],
    "PyTorch": ["pytorch", "py torch"],
    "Postman": ["postman"],
    "Selenium": ["selenium"],
    "Firebase": ["firebase"],
    "Flutter": ["flutter"],
    "Dart": ["dart"],
    "Java": ["java"],
    "Python": ["python"],
    "C": ["c programming", "programming in c", "language c"],
  };

  const containsSkill = (source: string, candidate: string) => {
    const normalizedCandidate = normalizeText(candidate);

    if (!normalizedCandidate) return false;

    if (normalizedCandidate === "c") {
      return /\bc\s*(programming|language)\b/i.test(source);
    }

    const escaped = normalizedCandidate
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");

    return new RegExp(
      `(?:^|\\s)${escaped}(?=\\s|$)`,
      "i"
    ).test(source);
  };

  const fallbackSkills: string[] = [];

  for (const predefinedSkill of PREDEFINED_SKILLS) {
    const candidates = [
      predefinedSkill,
      ...(skillAliases[predefinedSkill] || []),
    ];

    if (
      candidates.some((candidate) =>
        containsSkill(resumeTextNormalized, candidate)
      )
    ) {
      fallbackSkills.push(predefinedSkill);
    }
  }

  const extractedSkills: string[] = [];
  const seenExtracted = new Set<string>();

  for (const skill of [
    ...aiExtractedSkills,
    ...aiMatchedSkills,
    ...fallbackSkills,
  ]) {
    const cleanSkill = skill.trim();

    if (!cleanSkill) continue;

    const normalizedSkill = cleanSkill.toLowerCase();

    if (!seenExtracted.has(normalizedSkill)) {
      seenExtracted.add(normalizedSkill);
      extractedSkills.push(cleanSkill);
    }
  }

  const skillsSectionFound =
    aiData.skills_section_found === true ||
    extractedSkills.length > 0;

  console.log("========== FINAL SKILL EXTRACTION DEBUG ==========");
  console.log("AI extracted skills:", aiExtractedSkills);
  console.log("AI matched skills:", aiMatchedSkills);
  console.log("Fallback matched skills:", fallbackSkills);
  console.log("Final extracted skills:", extractedSkills);
  console.log("===================================================");

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

    skillsSectionFound,

    matchedSkills:
      Array.isArray(aiData.matched_skills)
        ? aiData.matched_skills
        : extractedSkills,
  };
}