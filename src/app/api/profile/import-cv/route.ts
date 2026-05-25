import { NextRequest, NextResponse } from 'next/server';
import { auth, getAuth } from '@clerk/nextjs/server';
import { getAIService } from '@/lib/ai/baseService';
import { stripEmojis } from '@/lib/text/stripEmojis';
import { ensureDbUser } from '@/lib/auth/ensureDbUser';
import type { RequestLike } from '@clerk/nextjs/server';

async function getUserFromRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId) return userId;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authRequest = new Request(request.url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const { userId: tokenUserId } = getAuth(authRequest as unknown as RequestLike);
      if (tokenUserId) return tokenUserId;
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const clerkId = await getUserFromRequest(request);
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDbUser(clerkId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const cvText =
    typeof (body as any)?.cvText === 'string' ? ((body as any).cvText as string).trim() : '';
  if (!cvText) {
    return NextResponse.json({ error: 'cvText is required' }, { status: 400 });
  }

  const safeCvText = cvText.slice(0, 12000);

  const template = `
Extract structured profile information from the resume text below and output ONLY valid JSON.

Rules:
- Do not include markdown, code fences, commentary, or extra keys.
- Use null when unknown (not empty string).
- Dates must be ISO format YYYY-MM-DD when possible, otherwise null.
- Arrays must be arrays (empty if none).
- No emojis.

Return JSON with EXACT keys:
{
  "firstName": string|null,
  "lastName": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "bio": string|null,
  "jobTitle": string|null,
  "education": [
    {
      "institution": string|null,
      "degree": string|null,
      "fieldOfStudy": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "current": boolean,
      "description": string|null
    }
  ],
  "workExperience": [
    {
      "company": string|null,
      "position": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "current": boolean,
      "description": string|null,
      "achievements": string[]
    }
  ],
  "technicalSkills": [
    {
      "name": string,
      "level": "Beginner"|"Intermediate"|"Advanced"|"Expert"
    }
  ],
  "softSkills": string[],
  "languages": [
    {
      "name": string,
      "proficiency": "Basic"|"Conversational"|"Fluent"|"Native"
    }
  ],
  "industries": string[],
  "jobTypes": ["Full-time"|"Part-time"|"Contract"|"Freelance"|"Internship"][],
  "remotePreference": "On-site"|"Hybrid"|"Remote"|"Flexible"|null,
  "relocation": boolean|null,
  "careerGoals": string|null,
  "projects": [
    {
      "name": string|null,
      "technologies": string|null,
      "description": string|null,
      "link": string|null
    }
  ],
  "references": [
    {
      "name": string|null,
      "relationship": string|null,
      "title": string|null,
      "company": string|null,
      "email": string|null,
      "phone": string|null,
      "recommendation": string|null
    }
  ]
}

Resume text:
{cvText}
`;

  try {
    const ai = getAIService();
    const raw = await ai.generateText(template, { cvText: safeCvText }, { temperature: 0.2, maxTokens: 2000 });
    const cleaned = stripEmojis(raw).trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        throw new Error('AI returned non-JSON output');
      }
    }

    return NextResponse.json({ patch: parsed }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to parse CV', message }, { status: 500 });
  }
}

