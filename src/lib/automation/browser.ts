import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
// @ts-ignore - playwright-extra has no first-party types for this integration path
import { addExtra } from "playwright-extra";
// @ts-ignore
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export interface LaunchOptions {
  headless?: boolean;
  cookies?: Array<{ name: string; value: string; domain: string; path?: string }>;
}

/**
 * Launches a stealth-patched Chromium instance.
 * Headed by default so the user can watch progress and solve CAPTCHAs manually.
 */
export async function launchBrowser(
  options: LaunchOptions = {}
): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const chromiumExtra = addExtra(chromium);
  chromiumExtra.use(StealthPlugin());

  const browser = await chromiumExtra.launch({
    headless: options.headless ?? false
  });

  const context = await browser.newContext({
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1366, height: 900 }
  });

  if (options.cookies && options.cookies.length > 0) {
    await context.addCookies(
      options.cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path ?? "/"
      }))
    );
  }

  const page = await context.newPage();
  return { browser, context, page };
}

export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
}
