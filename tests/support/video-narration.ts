// tests/support/video-narration.ts
// Narration for recorded videos, built only on Playwright's native screencast
// overlays (1.63+): page.screencast.showChapter() for a centred chapter card
// and page.screencast.showOverlay() for an assertion card with sample code.
// Step titles and action highlights come from `video.show` in the config.
import type { Page, TestInfo } from '@playwright/test';

/** True when this run keeps a video, so the test is worth pausing for the viewer. */
export function isVideoOn(testInfo: TestInfo): boolean {
  const video = testInfo.project.use.video;
  const mode = typeof video === 'string' ? video : video?.mode;
  return !!mode && mode !== 'off';
}

const CHAPTER_MS = 2_500;
const ASSERTION_MS = 3_000;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class Narrator {
  constructor(
    private readonly page: Page,
    private readonly enabled: boolean,
  ) {}

  /** Full-screen chapter card between phases of the journey. */
  async chapter(title: string, description: string): Promise<void> {
    if (!this.enabled) return;
    await this.page.screencast.showChapter(title, { description, duration: CHAPTER_MS });
    await this.page.waitForTimeout(CHAPTER_MS);
  }

  /**
   * Shows what the test is about to assert, with the real expect() code, and
   * leaves it on screen long enough to read before the assertion runs.
   */
  async assertion(what: string, code: string): Promise<void> {
    if (!this.enabled) return;
    const html = `
      <div style="position:fixed;left:50%;bottom:28px;transform:translateX(-50%);
                  max-width:88%;padding:14px 18px;border-radius:12px;
                  background:rgba(17,24,39,.94);color:#f9fafb;
                  font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                  box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:2147483647">
        <div style="font-weight:600;margin-bottom:8px;color:#a7f3d0">✔ Assertion: ${escapeHtml(what)}</div>
        <pre style="margin:0;padding:10px 12px;border-radius:8px;background:#0b1220;
                    color:#e5e7eb;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;
                    white-space:pre-wrap">${escapeHtml(code)}</pre>
      </div>`;
    const overlay = await this.page.screencast.showOverlay(html);
    await this.page.waitForTimeout(ASSERTION_MS);
    await overlay.dispose();
  }
}
