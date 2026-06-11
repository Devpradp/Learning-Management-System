import type { Point } from 'platejs';
import type { PlateEditor } from 'platejs/react';

export const LOREM_IPSUM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
  'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

function focusAt(editor: PlateEditor, at?: Point | null) {
  if (at) editor.tf.select(at);
  editor.tf.focus();
}

async function streamLoremIpsum(editor: PlateEditor, at?: Point | null) {
  focusAt(editor, at);

  for (const char of LOREM_IPSUM) {
    editor.tf.insertText(char);
    await new Promise((r) => setTimeout(r, 18));
  }
}

export async function runAICommand(
  editor: PlateEditor,
  prompt: string,
  at?: Point | null,
) {
  focusAt(editor, at);

  try {
    const res = await fetch('/api/ai/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) {
      await streamLoremIpsum(editor, at);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let insertedAny = false;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (!text) continue;
      insertedAny = true;
      editor.tf.insertText(text);
    }

    if (!insertedAny) {
      await streamLoremIpsum(editor, at);
    }
  } catch {
    await streamLoremIpsum(editor, at);
  }
}
