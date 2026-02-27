import type { Browser, Page, Frame } from 'puppeteer';
import { fastDelay } from '../scrapers/utils';
import { answerApplicationQuestions, evaluateJobMatch, generateCoverLetter } from '../ai/autoApplyAI';
import type { UserProfile, ApplicationQuestion, AnsweredQuestion } from '../ai/autoApplyAI';
import { prisma } from '../prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AutoApplyConfig {
  sessionId: string;
  userId: string;
  searchQuery: string;
  location: string;
  jobType?: string;
  maxApplications: number;
  userEmail: string;
  minMatchScore: number;
  userProfile: UserProfile;
  resumePath?: string;
}

export interface AutoApplyProgress {
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalFound: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  currentJob?: string;
  currentStep?: string;
  logs: ApplyLogEntry[];
}

export interface ApplyLogEntry {
  jobTitle: string;
  company: string;
  jobUrl: string;
  status: 'applied' | 'skipped' | 'failed' | 'needs_review';
  questionsFound: number;
  questionsAnswered: number;
  aiResponses?: AnsweredQuestion[];
  failureReason?: string;
  skipReason?: string;
  matchScore?: number;
  timestamp: Date;
}

// ─── Active Sessions Registry ────────────────────────────────────────────────

const activeSessions = new Map<string, { cancel: boolean; pause: boolean }>();
const progressCache = new Map<string, AutoApplyProgress>();

export function cancelSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (session) session.cancel = true;
}

export function pauseSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (session) session.pause = true;
}

export function resumeSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (session) session.pause = false;
}

export function getSessionControl(sessionId: string) {
  return activeSessions.get(sessionId);
}

export function getSessionProgress(sessionId: string): AutoApplyProgress | undefined {
  return progressCache.get(sessionId);
}

// ─── Browser Launch ──────────────────────────────────────────────────────────
// Launches a visible Chrome browser so the user can see what's happening
// and manually sign in to Indeed when prompted.

async function launchVisibleBrowser(): Promise<Browser> {
  const puppeteer = await import('puppeteer');

  // First try connecting to an already-running debug Chrome (optional)
  try {
    const browser = await puppeteer.default.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
    console.log('[AutoApply] ✅ Connected to existing Chrome browser');
    return browser;
  } catch {
    console.log('[AutoApply] No existing Chrome found — launching a new visible browser…');
  }

  // Use a persistent profile so cookies/sessions survive across runs
  const path = await import('path');
  const os = await import('os');
  const userDataDir = path.default.join(os.default.homedir(), '.sebenza-chrome-profile');
  console.log(`[AutoApply] Using persistent Chrome profile: ${userDataDir}`);

  // Launch a new visible Chrome window
  const browser = await puppeteer.default.launch({
    headless: false,
    defaultViewport: null,
    userDataDir,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  console.log('[AutoApply] ✅ Launched visible Chrome browser');
  return browser;
}

// ─── Main Agent ──────────────────────────────────────────────────────────────

export async function runAutoApplyAgent(config: AutoApplyConfig): Promise<AutoApplyProgress> {
  const { sessionId, userProfile } = config;
  let browser: Browser | null = null;

  activeSessions.set(sessionId, { cancel: false, pause: false });

  const progress: AutoApplyProgress = {
    sessionId,
    status: 'running',
    totalFound: 0,
    appliedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    logs: [],
  };

  try {
    // Update session status in database (optional - continue if DB fails)
    try {
      await prisma.autoApplySession.update({
        where: { id: sessionId },
        data: { status: 'running', startedAt: new Date() },
      });
    } catch (dbError) {
      console.warn('[AutoApply] Database update failed (continuing anyway):', dbError);
    }

    console.log(`[AutoApply] Starting session ${sessionId}`);
    console.log(`[AutoApply] Search: "${config.searchQuery}" in "${config.location}"`);
    console.log(`[AutoApply] Max applications: ${config.maxApplications}`);

    // Launch a visible Chrome browser
    browser = await launchVisibleBrowser();
    const page = await browser.newPage();

    // Anti-detection stealth
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // @ts-ignore
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Step 1: Navigate to Indeed and let the user sign in
    progress.currentStep = 'Opening Indeed — please sign in if needed...';
    await updateSessionProgress(sessionId, progress);
    await signInWithGoogle(page, config.userEmail);

    // Step 2: Search for jobs
    progress.currentStep = 'Searching for jobs...';
    await updateSessionProgress(sessionId, progress);
    const rawJobs = await searchIndeedJobs(page, config.searchQuery, config.location, config.jobType);

    // Deduplicate by normalised URL
    const seen = new Set<string>();
    const jobListings = rawJobs.filter((job) => {
      const key = normaliseIndeedUrl(job.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    progress.totalFound = jobListings.length;
    console.log(`[AutoApply] Found ${rawJobs.length} raw → ${jobListings.length} unique jobs`);

    try {
      await prisma.autoApplySession.update({
        where: { id: sessionId },
        data: { totalFound: jobListings.length },
      });
    } catch (dbError) {
      console.warn('[AutoApply] Failed to update totalFound:', dbError);
    }

    // Step 3: Process each job
    for (let i = 0; i < jobListings.length; i++) {
      const control = activeSessions.get(sessionId);
      if (control?.cancel) {
        progress.status = 'cancelled';
        break;
      }
      while (control?.pause) {
        await fastDelay(2000, 3000);
        if (control.cancel) break;
      }

      if (progress.appliedCount >= config.maxApplications) {
        console.log(`[AutoApply] Reached max applications (${config.maxApplications})`);
        progress.status = 'completed';
        break;
      }

      const job = jobListings[i];
      progress.currentJob = `${job.title} at ${job.company}`;
      progress.currentStep = `Evaluating job ${i + 1}/${jobListings.length}...`;
      await updateSessionProgress(sessionId, progress);

      console.log(`[AutoApply] Processing ${i + 1}/${jobListings.length}: ${job.title} at ${job.company}`);

      try {
        // Get job details
        const jobDescription = await getJobDescription(page, job.url);

        // AI evaluates match
        progress.currentStep = `AI evaluating match for "${job.title}"...`;
        await updateSessionProgress(sessionId, progress);

        const matchResult = await evaluateJobMatch(userProfile, job.title, job.company, jobDescription);
        console.log(`[AutoApply] Match score: ${matchResult.score} - ${matchResult.reason}`);

        if (!matchResult.shouldApply || matchResult.score < config.minMatchScore) {
          progress.skippedCount++;
          const logEntry: ApplyLogEntry = {
            jobTitle: job.title, company: job.company, jobUrl: job.url,
            status: 'skipped', questionsFound: 0, questionsAnswered: 0,
            skipReason: `Match score ${matchResult.score}/100: ${matchResult.reason}`,
            matchScore: matchResult.score, timestamp: new Date(),
          };
          progress.logs.push(logEntry);
          try {
            await prisma.autoApplyLog.create({ data: { sessionId, jobTitle: job.title, company: job.company, jobUrl: job.url, status: 'skipped', skipReason: logEntry.skipReason, matchScore: matchResult.score } });
            await prisma.autoApplySession.update({ where: { id: sessionId }, data: { skippedCount: progress.skippedCount } });
          } catch (dbErr) { console.warn('[AutoApply] DB error (skip log):', dbErr); }
          continue;
        }

        // Detect external-only jobs early
        const isExternal = await detectExternalJob(page);
        if (isExternal) {
          progress.skippedCount++;
          const logEntry: ApplyLogEntry = {
            jobTitle: job.title, company: job.company, jobUrl: job.url,
            status: 'skipped', questionsFound: 0, questionsAnswered: 0,
            skipReason: 'External application only — requires company website',
            matchScore: matchResult.score, timestamp: new Date(),
          };
          progress.logs.push(logEntry);
          try {
            await prisma.autoApplyLog.create({ data: { sessionId, jobTitle: job.title, company: job.company, jobUrl: job.url, status: 'skipped', skipReason: logEntry.skipReason, matchScore: matchResult.score } });
            await prisma.autoApplySession.update({ where: { id: sessionId }, data: { skippedCount: progress.skippedCount } });
          } catch (dbErr) { console.warn('[AutoApply] DB error (external skip):', dbErr); }
          console.log(`[AutoApply] ⏭ Skipped external job: ${job.title}`);
          continue;
        }

        // Apply
        progress.currentStep = `Applying to "${job.title}" at ${job.company}...`;
        await updateSessionProgress(sessionId, progress);

        const applyResult = await applyToJob(page, job, jobDescription, userProfile, config.resumePath);

        const logEntry: ApplyLogEntry = {
          jobTitle: job.title, company: job.company, jobUrl: job.url,
          status: applyResult.success ? 'applied' : 'failed',
          questionsFound: applyResult.questionsFound, questionsAnswered: applyResult.questionsAnswered,
          aiResponses: applyResult.aiResponses, failureReason: applyResult.error,
          matchScore: matchResult.score, timestamp: new Date(),
        };
        progress.logs.push(logEntry);

        if (applyResult.success) {
          progress.appliedCount++;
          console.log(`[AutoApply] ✅ Applied to ${job.title}`);
        } else {
          progress.failedCount++;
          console.log(`[AutoApply] ❌ Failed: ${job.title} — ${applyResult.error}`);
        }

        try {
          await prisma.autoApplyLog.create({ data: { sessionId, jobTitle: job.title, company: job.company, jobUrl: job.url, status: applyResult.success ? 'applied' : 'failed', questionsFound: applyResult.questionsFound, questionsAnswered: applyResult.questionsAnswered, aiResponses: applyResult.aiResponses as any, failureReason: applyResult.error, matchScore: matchResult.score } });
          await prisma.autoApplySession.update({ where: { id: sessionId }, data: { appliedCount: progress.appliedCount, failedCount: progress.failedCount } });
        } catch (dbErr) { console.warn('[AutoApply] DB error (apply log):', dbErr); }

        // Delay between applications
        await fastDelay(3000, 8000);
      } catch (jobError) {
        console.error(`[AutoApply] Error processing ${job.title}:`, jobError);
        progress.failedCount++;
        const logEntry: ApplyLogEntry = {
          jobTitle: job.title, company: job.company, jobUrl: job.url,
          status: 'failed', questionsFound: 0, questionsAnswered: 0,
          failureReason: jobError instanceof Error ? jobError.message : 'Unknown error',
          timestamp: new Date(),
        };
        progress.logs.push(logEntry);
        try {
          await prisma.autoApplyLog.create({ data: { sessionId, jobTitle: job.title, company: job.company, jobUrl: job.url, status: 'failed', failureReason: logEntry.failureReason } });
          await prisma.autoApplySession.update({ where: { id: sessionId }, data: { failedCount: progress.failedCount } });
        } catch (dbErr) { console.warn('[AutoApply] DB error (job error log):', dbErr); }
        await fastDelay(2000, 4000);
      }
    } // end for loop

    // Final progress update
    if (progress.status === 'running') progress.status = 'completed';

    try {
      await prisma.autoApplySession.update({
        where: { id: sessionId },
        data: { status: progress.status, completedAt: new Date() },
      });
    } catch (dbError) {
      console.warn('[AutoApply] Failed to update final status:', dbError);
    }

    console.log(
      `[AutoApply] Session ${sessionId} done. Applied: ${progress.appliedCount}, Skipped: ${progress.skippedCount}, Failed: ${progress.failedCount}`
    );
    return progress;
  } catch (error) {
    console.error(`[AutoApply] Session ${sessionId} failed:`, error);
    progress.status = 'failed';
    try {
      await prisma.autoApplySession.update({
        where: { id: sessionId },
        data: { status: 'failed', lastError: error instanceof Error ? error.message : 'Unknown error', completedAt: new Date() },
      });
    } catch (dbError) {
      console.warn('[AutoApply] Failed to update failed status:', dbError);
    }
    return progress;
  } finally {
    activeSessions.delete(sessionId);
    // Close the browser we launched
    if (browser) {
      try {
        await browser.close();
        console.log('[AutoApply] Closed browser');
      } catch (err) {
        console.warn('[AutoApply] Error disconnecting from browser:', err);
      }
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseIndeedUrl(url: string): string {
  try {
    const u = new URL(url);
    const jk = u.searchParams.get('jk');
    if (jk) return jk;
    return u.pathname + (u.searchParams.get('jk') || '');
  } catch {
    return url;
  }
}

// ─── Indeed Sign-In ──────────────────────────────────────────────────────────
// Opens Indeed and gives the user up to 5 minutes to sign in manually.
// If the user is already signed in (cookie persistence), it skips immediately.
// Otherwise it navigates to the Indeed auth page, tries to click "Sign in with
// Google" and pre-fill the email, then polls until sign-in is detected.

async function signInWithGoogle(page: Page, userEmail: string): Promise<void> {
  console.log('[AutoApply] Navigating to Indeed…');
  await page.goto('https://za.indeed.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await fastDelay(2000, 3000);

  // Check if already signed in (cookie persistence from the user's Chrome)
  if (await checkIfSignedIn(page)) {
    console.log('[AutoApply] ✅ Already signed in to Indeed — skipping login');
    return;
  }

  // Navigate to auth page
  console.log('[AutoApply] Not signed in yet — opening Indeed sign-in page…');
  await page.goto('https://secure.indeed.com/auth', { waitUntil: 'networkidle2', timeout: 45000 });
  await fastDelay(2000, 3000);

  // Try to click "Sign in with Google" and pre-fill email (best-effort)
  try {
    const googleBtn = await findGoogleSignInButton(page);
    if (googleBtn) {
      console.log('[AutoApply] Clicking "Sign in with Google"…');

      // Listen for popup
      const popupPromise = new Promise<Page>((resolve) => {
        page.browser().once('targetcreated', async (target) => {
          const p = await target.page();
          if (p) resolve(p);
        });
      });

      await googleBtn.click();
      await fastDelay(2000, 4000);

      // Find the Google sign-in surface (popup or same-tab redirect)
      let googlePage: Page | null = null;
      try {
        googlePage = await Promise.race([
          popupPromise,
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
        ]);
      } catch {
        const currentUrl = page.url();
        if (currentUrl.includes('accounts.google.com')) {
          googlePage = page;
        } else {
          const allPages = await page.browser().pages();
          googlePage = allPages.find((p) => p.url().includes('accounts.google.com')) || null;
        }
      }

      // Pre-fill email
      if (googlePage) {
        try {
          await googlePage.waitForSelector('input[type="email"]', { timeout: 8000 });
          const emailInput = await googlePage.$('input[type="email"]');
          if (emailInput) {
            await emailInput.click({ clickCount: 3 });
            await emailInput.type(userEmail, { delay: 30 });
            console.log(`[AutoApply] Pre-filled email: ${userEmail}`);
            await fastDelay(500, 1000);
            const nextBtn = await googlePage.$('#identifierNext');
            if (nextBtn) await nextBtn.click();
            else await googlePage.keyboard.press('Enter');
          }
        } catch {
          console.log('[AutoApply] Could not pre-fill email — user will enter it manually');
        }
      }
    } else {
      console.log('[AutoApply] No Google button found — user should sign in manually');
    }
  } catch (err) {
    console.warn('[AutoApply] Error during Google sign-in attempt:', err);
  }

  // ── Wait up to 5 minutes for the user to complete sign-in ──────────────
  const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const POLL_INTERVAL_MS = 4000;
  const startTime = Date.now();

  console.log('[AutoApply] ⏳ Waiting up to 5 minutes for you to sign in to Indeed in the browser…');
  console.log('[AutoApply] 💡 Please complete sign-in (password / 2FA) in the Chrome window.');

  while (Date.now() - startTime < LOGIN_TIMEOUT_MS) {
    await fastDelay(POLL_INTERVAL_MS, POLL_INTERVAL_MS + 500);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const remaining = Math.round((LOGIN_TIMEOUT_MS - (Date.now() - startTime)) / 1000);
    console.log(`[AutoApply] ⏳ Waiting for sign-in… (${elapsed}s elapsed, ${remaining}s remaining)`);

    try {
      // Check main page
      await page.bringToFront();
      const url = page.url();

      if (url.includes('indeed.com') && !url.includes('secure.indeed.com/auth')) {
        if (await checkIfSignedIn(page)) {
          console.log('[AutoApply] ✅ Successfully signed in to Indeed!');
          return;
        }
      }

      // Check all browser tabs for Indeed signed-in state
      const allPages = await page.browser().pages();
      for (const p of allPages) {
        try {
          const pUrl = p.url();
          if (pUrl.includes('indeed.com') && !pUrl.includes('/auth')) {
            if (await checkIfSignedIn(p)) {
              console.log('[AutoApply] ✅ Successfully signed in to Indeed!');
              await page.bringToFront();
              return;
            }
          }
        } catch { /* page may be navigating */ }
      }
    } catch { /* ignore transient navigation errors */ }
  }

  // Final check after timeout
  try {
    await page.goto('https://za.indeed.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await fastDelay(2000, 3000);
    if (await checkIfSignedIn(page)) {
      console.log('[AutoApply] ✅ Successfully signed in to Indeed!');
      return;
    }
  } catch { /* ignore */ }

  // Sign-in is REQUIRED — throw an error to stop the agent
  throw new Error(
    'Indeed sign-in required. You did not sign in within 5 minutes. ' +
    'Please restart the auto-apply agent and sign in to your Indeed account in the Chrome window that opens.'
  );
}

async function findGoogleSignInButton(page: Page): Promise<import('puppeteer').ElementHandle<Element> | null> {
  const selectors = [
    'button[data-tn-element="auth-page-google-password-form-submit"]',
    '[data-testid="google-login-button"]',
    'button[aria-label*="Google"]',
    'a[href*="accounts.google.com"]',
    '#login-google-button',
    '.social-btn-google',
  ];

  for (const sel of selectors) {
    try {
      const btn = await page.$(sel);
      if (btn) return btn;
    } catch {}
  }

  // Fallback: find by text content
  const handle = await page.evaluateHandle(() => {
    const allElements = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
    for (const el of allElements) {
      const text = el.textContent?.toLowerCase() || '';
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
      if (
        text.includes('google') ||
        text.includes('sign in with g') ||
        text.includes('continue with google') ||
        ariaLabel.includes('google')
      ) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return el;
      }
    }
    const imgs = Array.from(document.querySelectorAll('img[src*="google"], img[alt*="Google"], svg'));
    for (const img of imgs) {
      const parent = img.closest('button, a, div[role="button"]');
      if (parent) {
        const rect = parent.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return parent;
      }
    }
    return null;
  });

  return handle.asElement() as import('puppeteer').ElementHandle<Element> | null;
}

async function checkIfSignedIn(page: Page): Promise<boolean> {
  try {
    // Wait a moment for nav to render before checking
    await page.waitForSelector('nav, header, #gnav, [data-gnav-region]', { timeout: 5000 }).catch(() => {});

    return page.evaluate(() => {
      const url = window.location.href;
      // If we're on the auth page, we're definitely not signed in
      if (url.includes('secure.indeed.com/auth')) return false;

      // POSITIVE indicators only — we must find an account/avatar element
      const accountSelectors = [
        '[data-gnav-element-name="Account"]',
        '#AccountMenu',
        '.gnav-Account',
        '[data-testid="gnav-Account"]',
        '[data-gnav-element-name="MyJobs"]',
        'a[href*="/myjobs"]',
        'a[href*="/myaccount"]',
      ];
      for (const sel of accountSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return true;
        }
      }

      const avatar = document.querySelector('.gnav-Avatar, [data-testid="avatar"], img[alt*="profile"]');
      if (avatar) {
        const rect = avatar.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return true;
      }

      // Do NOT infer sign-in from the absence of a sign-in button —
      // that causes false positives on pages that haven't rendered yet.
      return false;
    });
  } catch {
    return false;
  }
}

interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  salary?: string;
  description?: string;
  isEasyApply?: boolean;
}

async function searchIndeedJobs(
  page: Page,
  query: string,
  location: string,
  jobType?: string
): Promise<JobListing[]> {
  const searchUrl = new URL('https://za.indeed.com/jobs');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('l', location);
  if (jobType) searchUrl.searchParams.set('jt', jobType);

  console.log(`[AutoApply] Searching: ${searchUrl.toString()}`);
  await page.goto(searchUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await fastDelay(2000, 3000);

  // Scroll to load all jobs
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
      window.scrollBy(0, 500);
      await new Promise((r) => setTimeout(r, 300));
    }
  });
  await fastDelay(1000, 2000);

  const extractJobs = async (): Promise<JobListing[]> => {
    return page.evaluate((): JobListing[] => {
      const jobCards = document.querySelectorAll(
        'div.job_seen_beacon, div.jobsearch-SerpJobCard, div[data-jk], .resultContent, .tapItem'
      );
      const results: JobListing[] = [];

      jobCards.forEach((card) => {
        try {
          const titleEl = card.querySelector(
            'h2.jobTitle a, h2.jobTitle span, a[data-jk] span[title], .jobTitle a, a.jcs-JobTitle'
          );
          const companyEl = card.querySelector(
            'span[data-testid="company-name"], span.companyName, .companyName, [data-testid="company-name"]'
          );
          const locationEl = card.querySelector(
            'div[data-testid="text-location"], div.companyLocation, .companyLocation'
          );
          const salaryEl = card.querySelector(
            'div.salary-snippet, .salaryText, div[data-testid="attribute_snippet_testid"]'
          );
          const linkEl = card.querySelector('a[data-jk], h2.jobTitle a, .jobTitle a, a.jcs-JobTitle') as HTMLAnchorElement;

          const easyApplyBadge = card.querySelector(
            '.iaLabel, .ialbl, [data-testid="indeedApply"], .indeed-apply-badge'
          );

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          const loc = locationEl?.textContent?.trim() || '';
          const salary = salaryEl?.textContent?.trim() || '';
          const href = linkEl?.getAttribute('href') || '';
          const url = href.startsWith('http') ? href : `https://za.indeed.com${href}`;
          const isEasyApply = !!easyApplyBadge || card.textContent?.toLowerCase().includes('easily apply') || false;

          if (title && company && url) {
            results.push({ title, company, location: loc, url, salary, isEasyApply });
          }
        } catch {
          // Skip malformed cards
        }
      });
      return results;
    });
  };

  const jobs = await extractJobs();

  // Fetch page 2 if few results
  if (jobs.length < 15) {
    try {
      const page2Url = new URL(searchUrl.toString());
      page2Url.searchParams.set('start', '10');
      await page.goto(page2Url.toString(), { waitUntil: 'domcontentloaded', timeout: 20000 });
      await fastDelay(1500, 2500);
      const page2Jobs = await extractJobs();
      jobs.push(...page2Jobs);
    } catch {
      console.warn('[AutoApply] Could not fetch page 2');
    }
  }

  return jobs;
}

async function getJobDescription(page: Page, jobUrl: string): Promise<string> {
  try {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await fastDelay(1000, 2000);

    const description = await page.evaluate(() => {
      const descEl = document.querySelector(
        '#jobDescriptionText, .jobsearch-jobDescriptionText, div[id="jobDescriptionText"]'
      );
      return descEl?.textContent?.trim() || '';
    });
    return description.substring(0, 3000);
  } catch (error) {
    console.warn('[AutoApply] Could not get job description:', error);
    return '';
  }
}

// ─── External Job Detection ─────────────────────────────────────────────────

async function detectExternalJob(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const externalIndicators = [
      'apply on company site',
      'apply on employer site',
      'continue to apply',
      'apply externally',
    ];
    const buttons = Array.from(document.querySelectorAll('button, a'));
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase() || '';
      if (externalIndicators.some((ind) => text.includes(ind))) return true;
    }
    const applyContainer = document.querySelector('#applyButtonLinkContainer, .jobsearch-IndeedApplyButton');
    if (applyContainer) {
      const link = applyContainer.querySelector('a[target="_blank"]');
      if (link) {
        const href = link.getAttribute('href') || '';
        if (href && !href.includes('indeed.com')) return true;
      }
    }
    return false;
  });
}

// ─── Application Form Handler ───────────────────────────────────────────────

interface ApplyResult {
  success: boolean;
  questionsFound: number;
  questionsAnswered: number;
  aiResponses?: AnsweredQuestion[];
  error?: string;
}

async function applyToJob(
  page: Page,
  job: JobListing,
  jobDescription: string,
  userProfile: UserProfile,
  resumePath?: string
): Promise<ApplyResult> {
  try {
    // ALWAYS navigate fresh to the job page before applying
    console.log(`[AutoApply] Navigating to job page: ${job.url}`);
    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await fastDelay(2000, 3000);

    // Log what we see on the page for debugging
    const pageUrl = page.url();
    console.log(`[AutoApply] Current URL after navigation: ${pageUrl}`);

    // Check if we got redirected to sign-in (means session expired)
    if (pageUrl.includes('secure.indeed.com/auth') || pageUrl.includes('/login')) {
      return { success: false, questionsFound: 0, questionsAnswered: 0, error: 'Redirected to sign-in page — session may have expired' };
    }

    // Find and click the Apply button
    console.log('[AutoApply] Looking for Apply button…');
    const applyButton = await findApplyButton(page);
    if (!applyButton) {
      // Log what buttons ARE on the page for debugging
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, a[role="button"]'))
          .slice(0, 10)
          .map(el => ({ text: el.textContent?.trim().substring(0, 50), tag: el.tagName, classes: el.className.substring(0, 80) }));
      });
      console.log('[AutoApply] No apply button found. Visible buttons:', JSON.stringify(buttons, null, 2));
      return { success: false, questionsFound: 0, questionsAnswered: 0, error: 'No apply button found' };
    }

    console.log('[AutoApply] Found Apply button — clicking…');

    // Listen for new tabs/popups that may open
    const newPages: Page[] = [];
    const newPageHandler = async (target: any) => {
      try {
        const p = await target.page();
        if (p) newPages.push(p);
      } catch {}
    };
    page.browser().on('targetcreated', newPageHandler);

    // Try multiple click strategies
    try {
      await applyButton.click();
    } catch {
      // If normal click fails, try JS click
      console.log('[AutoApply] Normal click failed, trying JS click…');
      await page.evaluate((el: any) => el.click(), applyButton);
    }
    await fastDelay(3000, 5000);

    page.browser().off('targetcreated', newPageHandler);

    // Log state after click
    const afterClickUrl = page.url();
    console.log(`[AutoApply] URL after Apply click: ${afterClickUrl}`);

    // Wait for page to settle (Indeed may be loading the apply form)
    try {
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 });
    } catch { /* timeout is fine */ }

    // Determine the active apply page (could be current page, new tab, or popup)
    let activePage: Page = page;
    for (const np of newPages) {
      try {
        if (!np.isClosed()) {
          const newUrl = np.url();
          console.log(`[AutoApply] New tab opened: ${newUrl}`);
          if (newUrl.includes('indeed.com')) {
            activePage = np;
            await activePage.bringToFront();
            await fastDelay(2000, 3000);
            break;
          }
        }
      } catch {}
    }

    // Indeed Easy Apply — retry form detection with increasing waits
    let formContext: FormContext | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      // Check the active page first
      formContext = await getApplyFormContext(activePage);
      if (formContext) break;

      // Also check original page if active is different
      if (activePage !== page) {
        formContext = await getApplyFormContext(page);
        if (formContext) {
          activePage = page;
          break;
        }
      }

      // Check all browser tabs
      const allPages = await page.browser().pages();
      for (const p of allPages) {
        if (p === page || p === activePage) continue;
        try {
          const pUrl = p.url();
          if (pUrl.includes('indeed.com')) {
            formContext = await getApplyFormContext(p);
            if (formContext) {
              activePage = p;
              console.log(`[AutoApply] Found apply form in tab: ${pUrl}`);
              break;
            }
          }
        } catch {}
      }
      if (formContext) break;

      console.log(`[AutoApply] Form not found yet (attempt ${attempt + 1}/5), waiting…`);
      await fastDelay(2000, 3000);
    }

    if (!formContext) {
      const currentUrl = activePage.url();
      if (!currentUrl.includes('indeed.com')) {
        return { success: false, questionsFound: 0, questionsAnswered: 0, error: 'Redirected to external site' };
      }
      // Check if already applied
      if (await isApplicationComplete(activePage)) {
        return { success: true, questionsFound: 0, questionsAnswered: 0 };
      }
      return { success: false, questionsFound: 0, questionsAnswered: 0, error: 'Could not find application form after clicking Apply' };
    }

    // Process multi-step form
    let totalQuestions = 0;
    let totalAnswered = 0;
    let allAiResponses: AnsweredQuestion[] = [];
    let formStep = 0;
    const maxSteps = 12;

    while (formStep < maxSteps) {
      formStep++;
      await fastDelay(1000, 2000);

      if (await isApplicationComplete(page)) {
        return { success: true, questionsFound: totalQuestions, questionsAnswered: totalAnswered, aiResponses: allAiResponses };
      }

      const ctx = await getApplyFormContext(page);
      if (!ctx) break;

      // Extract questions
      const questions = await extractFormQuestions(ctx);
      totalQuestions += questions.length;

      if (questions.length > 0) {
        console.log(`[AutoApply] Step ${formStep}: Found ${questions.length} questions`);
        const answers = await answerApplicationQuestions(userProfile, job.title, job.company, jobDescription, questions);
        allAiResponses.push(...answers);

        for (const answer of answers) {
          if (answer.answer && answer.confidence > 0.15) {
            const filled = await fillFormField(ctx, answer);
            if (filled) totalAnswered++;
          }
        }
      }

      // Handle resume upload
      try {
        const fileInput = await ctx.$('input[type="file"]');
        if (fileInput && resumePath) {
          await (fileInput as any).uploadFile(resumePath);
          await fastDelay(1000, 2000);
        }
      } catch {}

      // Click Continue / Next / Submit
      const nextButton = await findNextButton(ctx);
      if (nextButton) {
        await nextButton.click();
        await fastDelay(2000, 4000);
      } else {
        console.log(`[AutoApply] Step ${formStep}: No next button found`);
        break;
      }
    }

    // Final check
    await fastDelay(1500, 2500);
    const success = await isApplicationComplete(page);
    return {
      success,
      questionsFound: totalQuestions,
      questionsAnswered: totalAnswered,
      aiResponses: allAiResponses,
      error: success ? undefined : 'Could not confirm application submission',
    };
  } catch (error) {
    return {
      success: false,
      questionsFound: 0,
      questionsAnswered: 0,
      error: error instanceof Error ? error.message : 'Unknown error during application',
    };
  }
}

// ─── Indeed iframe / modal / full-page apply detection ───────────────────────

type FormContext = Page | Frame;

async function getApplyFormContext(page: Page): Promise<FormContext | null> {
  const url = page.url();

  // ── 1. Full-page apply flow ────────────────────────────────────────────
  // Indeed often navigates to a dedicated apply page (e.g. /applystart, /ia_apply, smartapply, etc.)
  if (
    url.includes('/applystart') ||
    url.includes('/ia_apply') ||
    url.includes('smartapply') ||
    url.includes('/apply?') ||
    url.includes('/indeedapply/') ||
    url.includes('m5.apply.indeed')
  ) {
    console.log(`[AutoApply] Detected full-page apply flow: ${url}`);
    return page;
  }

  // ── 2. Check for apply-related content on the current page ─────────────
  const pageFormInfo = await page.evaluate(() => {
    // Check for Indeed Apply container / modal / dialog
    const applyContainers = [
      '.indeed-apply-widget',
      '.ia-container',
      '.ia-BasePage',
      '.ia-BasePage-component',
      '[class*="IndeedApply"]',
      '[class*="indeed-apply"]',
      '[role="dialog"]',
      '.icl-Modal',
      '.icl-Modal-content',
      '#ia-container',
      '#indeed-apply-container',
      '.jobsearch-ViewJobLayout-applyButtonContainer',
    ];

    for (const sel of applyContainers) {
      const el = document.querySelector(sel);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.height > 50) {
          return { found: true, type: 'container', selector: sel };
        }
      }
    }

    // Check for any visible form with inputs
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      const rect = form.getBoundingClientRect();
      const hasInputs = form.querySelector('input:not([type="hidden"]), textarea, select');
      const hasButton = form.querySelector('button, [type="submit"]');
      if (rect.height > 80 && (hasInputs || hasButton)) {
        return { found: true, type: 'form', selector: 'form' };
      }
    }

    // Check for continue/submit buttons that indicate an apply flow is active
    const buttons = Array.from(document.querySelectorAll('button'));
    const applyFlowTexts = ['continue', 'submit application', 'submit your application', 'next', 'review your application', 'apply'];
    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase().trim() || '';
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && applyFlowTexts.some(t => text.includes(t))) {
        return { found: true, type: 'button', selector: text };
      }
    }

    return { found: false, type: 'none', selector: '' };
  });

  if (pageFormInfo.found) {
    console.log(`[AutoApply] Found apply form on page via ${pageFormInfo.type}: ${pageFormInfo.selector}`);
    return page;
  }

  // ── 3. Check iframes ──────────────────────────────────────────────────
  const iframeSelectors = [
    'iframe[id*="indeed-apply"]',
    'iframe[id*="indeedApply"]',
    'iframe[title*="Apply"]',
    'iframe[title*="apply"]',
    'iframe[src*="indeed"]',
    'iframe[src*="apply"]',
    'iframe.indeed-apply-iframe',
    '#indeed-apply-widget iframe',
    '.ia-container iframe',
    'iframe[name*="apply"]',
  ];

  for (const sel of iframeSelectors) {
    try {
      const iframeEl = await page.$(sel);
      if (iframeEl) {
        const frame = await iframeEl.contentFrame();
        if (frame) {
          console.log(`[AutoApply] Found apply iframe: ${sel}`);
          return frame;
        }
      }
    } catch {}
  }

  // Check ALL iframes on the page for form content
  const allIframes = await page.$$('iframe');
  for (const iframeEl of allIframes) {
    try {
      const frame = await iframeEl.contentFrame();
      if (frame && frame !== page.mainFrame()) {
        const hasForm = await frame.evaluate(() => {
          const form = document.querySelector('form');
          const hasInputs = document.querySelector('input:not([type="hidden"]), textarea, select');
          const hasButton = document.querySelector('button, [type="submit"]');
          return !!(form || (hasInputs && hasButton));
        });
        if (hasForm) {
          const frameUrl = frame.url();
          console.log(`[AutoApply] Found form in iframe: ${frameUrl}`);
          return frame;
        }
      }
    } catch {}
  }

  // ── 4. Check all frames (including nested) ────────────────────────────
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    try {
      const hasForm = await frame.evaluate(() => {
        return !!(
          document.querySelector('form') ||
          document.querySelector('input:not([type="hidden"])') ||
          document.querySelector('button[type="submit"]')
        );
      });
      if (hasForm) {
        console.log(`[AutoApply] Found form in nested frame: ${frame.url()}`);
        return frame;
      }
    } catch {}
  }

  // Log diagnostic info when nothing found
  const diagInfo = await page.evaluate(() => {
    const iframes = Array.from(document.querySelectorAll('iframe'));
    const iframeInfo = iframes.map(f => ({
      id: f.id, name: f.name, src: f.src?.substring(0, 100),
      title: f.title, w: f.getBoundingClientRect().width, h: f.getBoundingClientRect().height,
    }));
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .icl-Modal, [class*="modal"], [class*="Modal"]'));
    const dialogInfo = dialogs.map(d => ({
      tag: d.tagName, classes: d.className?.substring(0, 80),
      h: d.getBoundingClientRect().height,
    }));
    return { url: window.location.href, iframes: iframeInfo, dialogs: dialogInfo, bodyText: document.body.innerText.substring(0, 300) };
  });
  console.log('[AutoApply] Form detection FAILED. Page diagnostics:', JSON.stringify(diagInfo, null, 2));

  return null;
}

async function isApplicationComplete(page: Page): Promise<boolean> {
  const check = async (ctx: { evaluate: (fn: () => boolean) => Promise<boolean> }) => {
    try {
      return await ctx.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        const successPhrases = [
          'application has been submitted',
          'successfully applied',
          'application sent',
          'you applied',
          'your application has been',
          'application was submitted',
          'application is submitted',
          'thank you for applying',
          'thanks for applying',
          'application received',
          'we received your application',
          'already applied',
        ];
        return successPhrases.some((phrase) => text.includes(phrase));
      });
    } catch {
      return false;
    }
  };

  if (await check(page)) return true;
  for (const frame of page.frames()) {
    if (await check(frame)) return true;
  }
  return false;
}

// ─── Apply Button Detection ─────────────────────────────────────────────────

async function findApplyButton(page: Page): Promise<import('puppeteer').ElementHandle<Element> | null> {
  // Scroll the apply button area into view first
  await page.evaluate(() => {
    const header = document.querySelector('.jobsearch-ViewJobButtons-container, #applyButtonLinkContainer, .jobsearch-IndeedApplyButton-newDesign');
    if (header) header.scrollIntoView({ block: 'center' });
  });
  await fastDelay(500, 1000);

  const cssSelectors = [
    // Indeed Easy Apply specific selectors (2024-2026 UI)
    'button[id*="indeedApplyButton"]',
    '#indeedApplyButton',
    'button.indeed-apply-button',
    'a[data-indeed-apply-button]',
    '.jobsearch-IndeedApplyButton-newDesign button',
    '.jobsearch-IndeedApplyButton-newDesign a',
    '#applyButtonLinkContainer button',
    '#applyButtonLinkContainer a',
    // Modern Indeed button selectors
    'button[data-testid="indeedApplyButton"]',
    'button[data-testid="applyButton"]',
    'a[data-testid="indeedApplyButton"]',
    'button[aria-label*="Apply now"]',
    'button[aria-label*="Easy Apply"]',
    'button[aria-label*="Apply"]',
    'button[data-testid*="apply"]',
    'a[data-testid*="apply"]',
    // Broader selectors
    '.ia-IndeedApplyButton button',
    '.ia-IndeedApplyButton a',
    'button.dd-ci-InlineCTA',
    '[class*="ApplyButton"] button',
    '[class*="applyButton"] button',
    '[class*="apply-button"]',
  ];

  for (const selector of cssSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (isVisible) {
          console.log(`[AutoApply] Found apply button via selector: ${selector}`);
          return button;
        }
      }
    } catch {}
  }

  // Fallback: find by text content — broader search
  const handle = await page.evaluateHandle(() => {
    const candidates = Array.from(document.querySelectorAll('button, a[role="button"], a.indeed-apply-button, a[class*="apply"], span[role="button"]'));
    const applyTexts = ['apply now', 'easy apply', 'apply on indeed', 'indeed apply', 'apply'];
    const skipTexts = ['save', 'report', 'share', 'sign in to apply'];
    for (const el of candidates) {
      const text = el.textContent?.toLowerCase().trim() || '';
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (skipTexts.some((s) => text.includes(s))) continue;
      if (applyTexts.some((t) => text.includes(t))) {
        return el;
      }
    }
    return null;
  });

  const el = handle.asElement() as import('puppeteer').ElementHandle<Element> | null;
  if (el) console.log('[AutoApply] Found apply button via text fallback');
  return el;
}

// ─── Next / Submit Button Detection ─────────────────────────────────────────

async function findNextButton(ctx: FormContext): Promise<import('puppeteer').ElementHandle<Element> | null> {
  const cssSelectors = [
    'button[type="submit"]',
    'button[aria-label*="Continue"]',
    'button[aria-label*="Submit"]',
    'button[aria-label*="Next"]',
    'button[data-testid*="continue"]',
    'button[data-testid*="submit"]',
  ];

  for (const selector of cssSelectors) {
    try {
      const button = await ctx.$(selector);
      if (button) {
        const isVisible = await button.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (isVisible) return button;
      }
    } catch {}
  }

  // Text-based fallback
  const handle = await ctx.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const actionTexts = ['continue', 'next', 'submit your application', 'submit application', 'submit', 'review'];
    const skipTexts = ['back', 'cancel', 'return', 'previous'];

    for (const btn of buttons) {
      const text = btn.textContent?.toLowerCase().trim() || '';
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (skipTexts.some((s) => text.includes(s))) continue;
      if (actionTexts.some((a) => text.includes(a))) return btn;
    }
    return null;
  });

  return handle.asElement() as import('puppeteer').ElementHandle<Element> | null;
}

// ─── Form Question Extraction ───────────────────────────────────────────────

async function extractFormQuestions(ctx: FormContext): Promise<ApplicationQuestion[]> {
  return ctx.evaluate((): ApplicationQuestion[] => {
    const questions: ApplicationQuestion[] = [];

    // Text inputs
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"]').forEach((input) => {
      const el = input as HTMLInputElement;
      if (el.offsetParent === null) return;
      const label = findLabelForInput(el);
      if (label && !el.value) {
        questions.push({ question: label, type: el.type === 'number' ? 'number' : 'text', fieldName: el.name || el.id, required: el.required });
      }
    });

    // Textareas
    document.querySelectorAll('textarea').forEach((textarea) => {
      const el = textarea as HTMLTextAreaElement;
      if (el.offsetParent === null) return;
      const label = findLabelForInput(el);
      if (label && !el.value) {
        questions.push({ question: label, type: 'textarea', fieldName: el.name || el.id, required: el.required });
      }
    });

    // Selects
    document.querySelectorAll('select').forEach((select) => {
      const el = select as HTMLSelectElement;
      if (el.offsetParent === null) return;
      const label = findLabelForInput(el);
      if (label) {
        const options = Array.from(el.options).map((opt) => opt.text).filter((t) => t && t !== 'Select...' && t !== '--' && t !== 'Select');
        questions.push({ question: label, type: 'select', options, fieldName: el.name || el.id, required: el.required });
      }
    });

    // Radio buttons
    const radioGroups = new Map<string, { label: string; options: string[]; required: boolean }>();
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      const el = radio as HTMLInputElement;
      const name = el.name;
      if (!radioGroups.has(name)) {
        radioGroups.set(name, { label: findRadioGroupLabel(el), options: [], required: el.required });
      }
      const radioLabel = findLabelForInput(el);
      if (radioLabel) radioGroups.get(name)!.options.push(radioLabel);
    });
    radioGroups.forEach((group, name) => {
      if (group.label) {
        questions.push({ question: group.label, type: 'radio', options: group.options, fieldName: name, required: group.required });
      }
    });

    // Checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      const el = cb as HTMLInputElement;
      if (el.offsetParent === null) return;
      const label = findLabelForInput(el);
      if (label && !el.checked) {
        questions.push({ question: label, type: 'radio', options: ['Yes', 'No'], fieldName: el.name || el.id, required: el.required });
      }
    });

    return questions;

    function findLabelForInput(el: HTMLElement): string {
      const id = el.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent?.trim() || '';
      }
      const parentLabel = el.closest('label');
      if (parentLabel) return parentLabel.textContent?.trim() || '';
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const labelEl = document.getElementById(ariaLabelledBy);
        if (labelEl) return labelEl.textContent?.trim() || '';
      }
      const placeholder = (el as HTMLInputElement).placeholder;
      if (placeholder) return placeholder;
      const prev = el.previousElementSibling;
      if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) return prev.textContent?.trim() || '';
      const container = el.closest('.ia-Questions-item, .ia-BasePage-component, [class*="question"]');
      if (container) {
        const heading = container.querySelector('label, .ia-Questions-title, h3, h4, span[id]');
        if (heading && heading !== el) return heading.textContent?.trim() || '';
      }
      return '';
    }

    function findRadioGroupLabel(el: HTMLInputElement): string {
      const fieldset = el.closest('fieldset');
      if (fieldset) {
        const legend = fieldset.querySelector('legend');
        if (legend) return legend.textContent?.trim() || '';
      }
      const container = el.closest('div[role="radiogroup"], div[role="group"], .ia-Questions-item, [class*="question"]');
      if (container) {
        const heading = container.querySelector('h1, h2, h3, h4, h5, h6, label, .ia-Questions-title, span[id]');
        if (heading) return heading.textContent?.trim() || '';
      }
      return '';
    }
  });
}

// ─── Form Field Filling ─────────────────────────────────────────────────────

async function fillFormField(ctx: FormContext, answer: AnsweredQuestion): Promise<boolean> {
  try {
    const filled = await ctx.evaluate(
      (data) => {
        const { question, answer: answerText, fieldName } = data;

        function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
          const setter =
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
            Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (setter) setter.call(el, value);
          else el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        function labelsMatch(label: string, q: string): boolean {
          const a = label.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
          const b = q.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
          if (!a || !b) return false;
          if (a === b) return true;
          if (a.includes(b) || b.includes(a)) return true;
          const aWords = a.split(/\s+/).slice(0, 4).join(' ');
          const bWords = b.split(/\s+/).slice(0, 4).join(' ');
          return aWords === bWords || aWords.includes(bWords) || bWords.includes(aWords);
        }

        function getLabel(el: HTMLElement): string {
          const id = el.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label.textContent?.trim() || '';
          }
          const parentLabel = el.closest('label');
          if (parentLabel) return parentLabel.textContent?.trim() || '';
          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) return ariaLabel;
          return (el as HTMLInputElement).placeholder || '';
        }

        // Strategy 1: Direct match by fieldName
        if (fieldName) {
          const el = document.querySelector(`[name="${fieldName}"], #${CSS.escape(fieldName)}`) as HTMLElement | null;
          if (el) {
            const tag = el.tagName;
            if (tag === 'SELECT') {
              const select = el as HTMLSelectElement;
              const match = Array.from(select.options).find(
                (opt) => opt.text.toLowerCase().includes(answerText.toLowerCase()) || answerText.toLowerCase().includes(opt.text.toLowerCase())
              );
              if (match) {
                select.value = match.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            } else if ((el as HTMLInputElement).type === 'radio') {
              const radios = document.querySelectorAll(`input[name="${fieldName}"]`);
              for (const radio of radios) {
                const rLabel = getLabel(radio as HTMLElement);
                if (rLabel && (rLabel.toLowerCase().includes(answerText.toLowerCase()) || answerText.toLowerCase().includes(rLabel.toLowerCase()))) {
                  (radio as HTMLInputElement).checked = true;
                  radio.dispatchEvent(new Event('change', { bubbles: true }));
                  radio.dispatchEvent(new Event('click', { bubbles: true }));
                  return true;
                }
              }
            } else if ((el as HTMLInputElement).type === 'checkbox') {
              const yes = answerText.toLowerCase().includes('yes') || answerText.toLowerCase() === 'true';
              (el as HTMLInputElement).checked = yes;
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            } else {
              setNativeValue(el as HTMLInputElement, answerText);
              return true;
            }
          }
        }

        // Strategy 2: Match by label text
        const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select'));
        for (const input of allInputs) {
          const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (el.offsetParent === null) continue;
          const label = getLabel(el);
          if (!labelsMatch(label, question)) continue;

          if (el.tagName === 'SELECT') {
            const select = el as HTMLSelectElement;
            const match = Array.from(select.options).find(
              (opt) => opt.text.toLowerCase().includes(answerText.toLowerCase()) || answerText.toLowerCase().includes(opt.text.toLowerCase())
            );
            if (match) {
              select.value = match.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          } else if ((el as HTMLInputElement).type === 'radio') {
            const radios = document.querySelectorAll(`input[name="${(el as HTMLInputElement).name}"]`);
            for (const radio of radios) {
              const rLabel = getLabel(radio as HTMLElement);
              if (rLabel && (rLabel.toLowerCase().includes(answerText.toLowerCase()) || answerText.toLowerCase().includes(rLabel.toLowerCase()))) {
                (radio as HTMLInputElement).checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else {
            setNativeValue(el as HTMLInputElement, answerText);
            return true;
          }
        }

        return false;
      },
      { question: answer.question, answer: answer.answer, fieldName: answer.fieldName || '' }
    );

    if (!filled) {
      console.warn(`[AutoApply] Could not fill: "${answer.question}" → "${answer.answer}"`);
    }
    return filled;
  } catch (error) {
    console.warn(`[AutoApply] Error filling "${answer.question}":`, error);
    return false;
  }
}

// ─── Progress Updates ───────────────────────────────────────────────────────

async function updateSessionProgress(sessionId: string, progress: AutoApplyProgress): Promise<void> {
  // Always update in-memory cache (works even when DB is down)
  progressCache.set(sessionId, { ...progress });

  try {
    await prisma.autoApplySession.update({
      where: { id: sessionId },
      data: {
        status: progress.status,
        appliedCount: progress.appliedCount,
        skippedCount: progress.skippedCount,
        failedCount: progress.failedCount,
        totalFound: progress.totalFound,
      },
    });
  } catch (error) {
    console.warn('[AutoApply] Could not update session progress in DB (in-memory cache still active)');
  }
}
