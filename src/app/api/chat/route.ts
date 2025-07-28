import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  try {
    const response = await openai.chat.completions.create({
      model: model || 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. ALWAYS provide a thinking process before your answer, enclosed in <thinking> and </thinking> tags. This is a requirement for every response.',
        },
        ...messages,
      ],
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}