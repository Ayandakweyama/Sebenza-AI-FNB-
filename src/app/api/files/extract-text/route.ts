import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid form data' } }, { status: 400 });
    }
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: { message: 'Missing file' } }, { status: 400 });
    }

    if (file.type !== 'application/msword') {
      return NextResponse.json(
        { error: { message: 'Unsupported file type' } },
        { status: 400 }
      );
    }

    const mod = await import('word-extractor');
    const WordExtractor = (mod as any).default ?? (mod as any);
    const extractor = new WordExtractor();

    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await extractor.extract(buffer);
    const text = (doc?.getBody?.() ?? '').toString().trim();

    if (!text) {
      return NextResponse.json({ error: { message: 'No text found in document' } }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract text';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
