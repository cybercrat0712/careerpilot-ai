import type { Page } from "playwright";

export interface ExtractedField {
  selector: string;
  tag: "input" | "select" | "textarea";
  type: string; // e.g. text, email, tel, file, checkbox, radio
  name: string;
  id: string;
  label: string;
  required: boolean;
  options?: string[]; // for <select>
}

/**
 * Runs inside the browser context to serialize all form-relevant elements
 * on the current page into a structured JSON schema for the AI solver.
 */
export async function extractFormFields(page: Page): Promise<ExtractedField[]> {
  return page.evaluate(() => {
    function findLabelText(el: Element): string {
      const id = el.getAttribute("id");
      if (id) {
        const labelEl = document.querySelector(`label[for="${id}"]`);
        if (labelEl?.textContent) return labelEl.textContent.trim();
      }
      const parentLabel = el.closest("label");
      if (parentLabel?.textContent) return parentLabel.textContent.trim();

      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) return ariaLabel.trim();

      const placeholder = el.getAttribute("placeholder");
      if (placeholder) return placeholder.trim();

      return "";
    }

    function buildSelector(el: Element, index: number): string {
      const id = el.getAttribute("id");
      if (id) return `#${CSS.escape(id)}`;
      const name = el.getAttribute("name");
      if (name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
      return `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
    }

    const elements = Array.from(
      document.querySelectorAll("input, select, textarea")
    ) as HTMLElement[];

    const fields = elements
      .filter((el) => {
        const type = (el as HTMLInputElement).type;
        return type !== "hidden" && type !== "submit" && type !== "button";
      })
      .map((el, index) => {
        const tag = el.tagName.toLowerCase() as "input" | "select" | "textarea";
        const type = (el as HTMLInputElement).type || tag;
        const options =
          tag === "select"
            ? Array.from((el as HTMLSelectElement).options).map((o) => o.textContent?.trim() || o.value)
            : undefined;

        return {
          selector: buildSelector(el, index),
          tag,
          type,
          name: el.getAttribute("name") || "",
          id: el.getAttribute("id") || "",
          label: findLabelText(el),
          required: el.hasAttribute("required"),
          options
        };
      });

    return fields;
  });
}
