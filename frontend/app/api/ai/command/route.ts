import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request): Promise<Response> {
  const { prompt } = await req.json() as { prompt: string };
  const result = streamText({
    model: openai('gpt-4o-mini'),
    prompt,
  });
  return result.toTextStreamResponse();
}
