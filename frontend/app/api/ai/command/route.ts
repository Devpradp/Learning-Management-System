import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(null, { status: 503 });
  }

  try {
    const { prompt } = await req.json() as { prompt: string };

    if (!prompt?.trim()) {
      return new Response(null, { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response(null, { status: 503 });
  }
}
