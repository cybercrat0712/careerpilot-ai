import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedField } from "@/lib/automation/extractor";
import candidate from "../../../data/candidate.json";

export interface FieldMapping {
  selector: string;
  action: "type" | "select" | "check" | "upload";
  value: string;
}

const SYSTEM_INSTRUCTIONS = `You are a form-filling assistant for job applications.
You will receive:
1. A JSON array of form fields extracted from a job application page.
2. A candidate profile JSON with the applicant's real information.

Return ONLY a JSON array (no markdown, no prose) of objects shaped like:
{ "selector": string, "action": "type" | "select" | "check" | "upload", "value": string }

Rules:
- Match each field to the most relevant candidate data.
- For "select" fields, "value" must exactly match one of the provided options.
- For file inputs (resume/CV), use action "upload" and value "data/resume.pdf".
- For open-ended screening questions (e.g. "why this role", "salary expectations"),
  draft a concise, professional, honest answer using the candidate's summary/preferences.
- If a field cannot be confidently answered, omit it rather than guessing wildly.
- Never fabricate credentials, dates, or claims not present in the candidate profile.`;

export async function solveForm(fields: ExtractedField[]): Promise<FieldMapping[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${SYSTEM_INSTRUCTIONS}

FORM_FIELDS:
${JSON.stringify(fields, null, 2)}

CANDIDATE_PROFILE:
${JSON.stringify(candidate, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonText = text.startsWith("```")
    ? text.replace(/```json\n?|```/g, "").trim()
    : text;

  try {
    return JSON.parse(jsonText) as FieldMapping[];
  } catch (err) {
    throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
  }
}
