import path from "path";
import type { Page } from "playwright";
import type { FieldMapping } from "@/lib/ai/solver";

/**
 * Applies the AI-generated field mapping to the live page.
 * Runs sequentially so upload/select actions don't race each other.
 */
export async function fillForm(page: Page, mapping: FieldMapping[]): Promise<void> {
  for (const field of mapping) {
    try {
      switch (field.action) {
        case "type":
          await page.fill(field.selector, field.value, { timeout: 5000 });
          break;

        case "select":
          await page.selectOption(field.selector, { label: field.value }, { timeout: 5000 });
          break;

        case "check":
          await page.check(field.selector, { timeout: 5000 });
          break;

        case "upload": {
          const resumePath = path.join(process.cwd(), "data", "resume.pdf");
          await page.setInputFiles(field.selector, resumePath, { timeout: 5000 });
          break;
        }

        default:
          console.warn(`Unknown action "${field.action}" for selector ${field.selector}`);
      }
    } catch (err) {
      console.warn(`Skipping field ${field.selector}: ${(err as Error).message}`);
    }
  }
}
