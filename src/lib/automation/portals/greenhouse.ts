import type { Page } from "playwright";
import { extractFormFields } from "@/lib/automation/extractor";
import { solveForm } from "@/lib/ai/solver";
import { fillForm } from "@/lib/automation/filler";

/**
 * Greenhouse-hosted job pages are mostly static single-page forms.
 * This is the reference implementation the other portal modules will follow.
 */
export async function runGreenhouseApplication(page: Page, jobUrl: string) {
  await page.goto(jobUrl, { waitUntil: "domcontentloaded" });

  // Greenhouse embeds the actual application form in an iframe on some boards;
  // fall back to main frame if no iframe is present.
  const frame = page.frames().find((f) => f.url().includes("boards.greenhouse.io")) || page.mainFrame();

  const fields = await extractFormFields(page);
  const mapping = await solveForm(fields);
  await fillForm(page, mapping);

  // Pause before submit so the pipeline can screenshot + let engine.ts decide
  // whether to auto-click submit based on a confirmation flag.
  return { fields, mapping, frameUrl: frame.url() };
}
