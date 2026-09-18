import path from "path";
import { launchBrowser, closeBrowser } from "@/lib/automation/browser";
import { runGreenhouseApplication } from "@/lib/automation/portals/greenhouse";
import { prisma } from "@/lib/db";

export type Portal = "greenhouse" | "lever" | "linkedin" | "workday";

export function detectPortal(jobUrl: string): Portal | null {
  if (jobUrl.includes("greenhouse.io")) return "greenhouse";
  if (jobUrl.includes("lever.co")) return "lever";
  if (jobUrl.includes("linkedin.com")) return "linkedin";
  if (jobUrl.includes("myworkdayjobs.com") || jobUrl.includes("workday.com")) return "workday";
  return null;
}

export interface RunResult {
  status: "submitted" | "failed";
  screenshotUrl?: string;
  error?: string;
}

export async function runApplication(jobUrl: string): Promise<RunResult> {
  const portal = detectPortal(jobUrl);

  if (!portal) {
    return { status: "failed", error: "Unsupported portal for this URL." };
  }

  const application = await prisma.application.create({
    data: { jobUrl, portal, status: "pending" }
  });

  const { browser, page } = await launchBrowser({ headless: false });

  try {
    if (portal !== "greenhouse") {
      throw new Error(`Portal "${portal}" automation is not implemented yet. Start with Greenhouse.`);
    }

    await runGreenhouseApplication(page, jobUrl);

    const screenshotRelPath = `screenshots/${application.id}.png`;
    const screenshotAbsPath = path.join(process.cwd(), "public", screenshotRelPath);
    await page.screenshot({ path: screenshotAbsPath, fullPage: true });

    await prisma.application.update({
      where: { id: application.id },
      data: { status: "submitted", screenshotUrl: `/${screenshotRelPath}` }
    });

    return { status: "submitted", screenshotUrl: `/${screenshotRelPath}` };
  } catch (err) {
    const message = (err as Error).message;
    await prisma.application.update({
      where: { id: application.id },
      data: { status: "failed", error: message }
    });
    return { status: "failed", error: message };
  } finally {
    await closeBrowser(browser);
  }
}
