import { NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, system, model, apiKey } = await req.json();
    
    const google = createGoogleGenerativeAI({
      apiKey: apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    });

    const { text } = await generateText({
      model: google(model || 'gemini-3-flash-preview'),
      prompt,
      system,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
