import crypto from 'crypto';
import type { CareerOpportunity, OpportunityType } from './types';

export function stableIdFromUrl(url: string) {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
}

export function stripTags(html: string) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateLoose(s: string) {
  const raw = String(s || '').trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

export function parseClosingDateLoose(text: string) {
  const t = String(text || '');
  const m1 = t.match(/Closes:\s*([0-9]{1,2}\s+[A-Za-z]{3,}\s+[0-9]{4})/i);
  if (m1) return parseDateLoose(m1[1]);

  const m2 = t.match(/Apply by\s*([0-9]{1,2}\s+[A-Za-z]{3,}\s+[0-9]{4})/i);
  if (m2) return parseDateLoose(m2[1]);

  const m3 = t.match(/Closing Date:\s*([0-9]{1,2}\s+[A-Za-z]{3,}\s+[0-9]{4})/i);
  if (m3) return parseDateLoose(m3[1]);

  return null;
}

export function parsePostedDateLoose(text: string) {
  const t = String(text || '');
  const m = t.match(/Posted:\s*([0-9]{1,2}\s+[A-Za-z]{3,}\s+[0-9]{4})/i);
  if (m) return parseDateLoose(m[1]);
  return null;
}

export function inferOpportunityType(title: string, url?: string): OpportunityType {
  const t = `${title || ''} ${url || ''}`.toLowerCase();
  if (/(bursar|bursary)/.test(t)) return 'Bursary';
  if (/(learnership|apprenticeship|traineeship|se?ta)/.test(t)) return 'Learnership';
  if (/(internship|intern\b|clerkship|placement)/.test(t)) return 'Internship';
  if (/(graduate programme|graduate program|grad programme|graduate trainee|global graduate|graduate scheme)/.test(t)) return 'Graduate Programme';
  return 'Entry-Level Job';
}

export function inferCareerField(text: string) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return null;

  const rules: Array<[RegExp, string]> = [
    [/(software|developer|engineer|devops|cloud|cyber|security|data analyst|data science|machine learning|ai\b|ml\b|python|java\b|typescript|react|node\.js|sql|power bi|it\b)/i, 'IT & Data'],
    [/(accountant|audit|financial|finance|bank|credit|risk|treasury|cfa|actuarial)/i, 'Finance'],
    [/(mechanical|electrical|civil|industrial|chemical|mechatronic|engineering|technician|artisan)/i, 'Engineering'],
    [/(marketing|brand|seo|social media|communications|content|public relations|pr\b|sales|business development|account executive)/i, 'Sales & Marketing'],
    [/(human resources|hr\b|talent|recruit|people partner|payroll)/i, 'HR'],
    [/(legal|law|attorney|paralegal|compliance|governance)/i, 'Law & Compliance'],
    [/(nurse|medical|health|clinic|hospital|pharma|laboratory|radiography)/i, 'Healthcare'],
    [/(teacher|education|school|university|lecturer|tutor)/i, 'Education'],
    [/(logistics|supply chain|procurement|warehouse|transport|fleet)/i, 'Supply Chain'],
    [/(mining|miner|geology|metall|plant|resources)/i, 'Mining & Resources'],
    [/(government|department|municipal|public service|saps|dpsa|doh|doe|dti|treasury)/i, 'Government'],
    [/(environment|sustainability|climate|conservation)/i, 'Environment'],
  ];

  for (const [re, label] of rules) {
    if (re.test(t)) return label;
  }
  return 'General';
}

export function dedupeOpportunities(items: CareerOpportunity[]) {
  const map = new Map<string, CareerOpportunity>();
  for (const it of items) {
    const key = it.url;
    if (!key) continue;
    if (!map.has(key)) map.set(key, it);
  }
  return Array.from(map.values());
}
