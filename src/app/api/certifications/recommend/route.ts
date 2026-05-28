import { NextRequest, NextResponse } from 'next/server';
import { stripEmojis } from '@/lib/text/stripEmojis';

type EducationItem = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  description?: string;
};

type RequestBody = {
  education?: EducationItem[];
  technicalSkills?: string[];
  industries?: string[];
  jobTitle?: string;
  selectedJobTitle?: string;
};

type Certification = { name: string; reason?: string };

const model = 'gpt-4o-mini';

function normalizeText(input: unknown) {
  return typeof input === 'string' ? input.trim() : '';
}

function computeFallbackCertifications(params: RequestBody): Certification[] {
  const educationText = [
    ...(params.education || []).map((e) =>
      [e.degree, e.fieldOfStudy, e.institution, e.description].filter(Boolean).join(' ')
    ),
    params.jobTitle,
    params.selectedJobTitle,
    ...(params.industries || []),
    ...(params.technicalSkills || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const out: Certification[] = [];

  const add = (name: string, reason: string) => {
    if (out.some((c) => c.name === name)) return;
    out.push({ name, reason });
  };

  const has = (re: RegExp) => re.test(educationText);

  if (has(/(software|developer|programming|computer science|information technology|it|web|frontend|backend|cloud|devops)/)) {
    add('AWS Cloud Practitioner', 'Strong baseline cloud credential for software/IT roles.');
    add('Microsoft Azure Fundamentals (AZ-900)', 'Validates cloud fundamentals widely requested in SA job postings.');
    add('Google Cloud Digital Leader', 'Broad cloud literacy credential that complements cloud projects.');
    add('ITIL 4 Foundation', 'Useful for IT service delivery and enterprise environments.');
  }

  if (has(/(data|analytics|business intelligence|bi|sql|statistics|econometrics|machine learning|ai)/)) {
    add('Google Data Analytics', 'Practical analytics credential aligned to entry/mid roles.');
    add('Microsoft Power BI Data Analyst (PL-300)', 'Directly applicable to BI reporting roles.');
    add('IBM Data Science Professional Certificate', 'Structured path for data science fundamentals.');
  }

  if (has(/(security|cyber|network|penetration|forensics|soc)/)) {
    add('CompTIA Security+', 'Best first certification for cybersecurity fundamentals.');
    add('Microsoft Security, Compliance, and Identity Fundamentals (SC-900)', 'Good baseline for security governance and cloud identity.');
    add('Fortinet NSE 4', 'Relevant for network security roles in many enterprises.');
  }

  if (has(/(project|pm|management|scrum|agile)/)) {
    add('Scrum Master (PSM I)', 'Common requirement for agile delivery roles.');
    add('PRINCE2 Foundation', 'Widely recognized project management certification in SA/UK-aligned orgs.');
  }

  if (has(/(finance|accounting|audit|tax|bank|investment|economics)/)) {
    add('CFA Investment Foundations', 'Strong entry credential for investment and finance track.');
    add('CIMA Certificate in Business Accounting', 'Practical accounting credential for business/finance roles.');
  }

  if (!out.length) {
    add('Google Project Management', 'General credential that helps across many career paths.');
    add('Microsoft Excel Expert (MO-201)', 'Highly transferable for most professional roles.');
    add('LinkedIn Learning Path: Interview Prep', 'Quick-win credential to support job search readiness.');
  }

  return out.slice(0, 6);
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;

    const payload: RequestBody = {
      education: Array.isArray(body.education) ? body.education : [],
      technicalSkills: Array.isArray(body.technicalSkills) ? body.technicalSkills.map(normalizeText).filter(Boolean) : [],
      industries: Array.isArray(body.industries) ? body.industries.map(normalizeText).filter(Boolean) : [],
      jobTitle: normalizeText(body.jobTitle),
      selectedJobTitle: normalizeText(body.selectedJobTitle),
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        source: 'fallback',
        certifications: computeFallbackCertifications(payload),
      });
    }

    const educationSummary = (payload.education || [])
      .map((e) =>
        [
          e.degree ? `Degree: ${e.degree}` : null,
          e.fieldOfStudy ? `Field: ${e.fieldOfStudy}` : null,
          e.institution ? `Institution: ${e.institution}` : null,
          e.description ? `Notes: ${e.description}` : null,
        ]
          .filter(Boolean)
          .join(' | ')
      )
      .filter(Boolean)
      .join('\n');

    const systemPrompt =
      'You are Afrigter, an expert career mentor. Recommend certifications strictly based on the user profile context. Do not use emojis. Output only valid JSON.';

    const prompt = `Generate 5-7 certification recommendations based on this user profile. Focus on practical, widely-recognized certifications for the South African job market when possible.

User context:
- Target job title: ${payload.selectedJobTitle || payload.jobTitle || 'Not specified'}
- Industries: ${(payload.industries || []).join(', ') || 'Not specified'}
- Technical skills: ${(payload.technicalSkills || []).join(', ') || 'Not specified'}
- Education:
${educationSummary || 'Not specified'}

Return JSON in this exact shape:
{
  "certifications": [
    { "name": "string", "reason": "string" }
  ]
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        source: 'fallback',
        certifications: computeFallbackCertifications(payload),
      });
    }

    const data = (await res.json().catch(() => null)) as any;
    const content = stripEmojis(String(data?.choices?.[0]?.message?.content || '')).trim();
    const parsed = extractJsonObject(content);
    const certifications = Array.isArray(parsed?.certifications)
      ? (parsed.certifications as any[])
          .map((c) => ({
            name: normalizeText(c?.name),
            reason: normalizeText(c?.reason),
          }))
          .filter((c) => c.name)
          .slice(0, 7)
      : [];

    if (!certifications.length) {
      return NextResponse.json({
        source: 'fallback',
        certifications: computeFallbackCertifications(payload),
      });
    }

    return NextResponse.json({ source: 'ai', certifications });
  } catch (e) {
    return NextResponse.json({ source: 'fallback', certifications: computeFallbackCertifications({}) });
  }
}

