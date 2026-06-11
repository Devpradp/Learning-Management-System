'use client';

import * as React from 'react';

import { createSlatePlugin } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, toPlatePlugin, useEditorRef } from 'platejs/react';

import { runAICommand } from '@/lib/ai-command';

export const AI_INPUT_KEY = 'ai_input';

const BaseAIInputPlugin = createSlatePlugin({
  key: AI_INPUT_KEY,
  editOnly: true,
  node: { isElement: true, isInline: true, isVoid: true },
});

export const AIInputPlugin = toPlatePlugin(BaseAIInputPlugin).withComponent(AIInputElement);

let _insertAIInput: (() => void) | null = null;

export function setInsertAIInput(cb: () => void) {
  _insertAIInput = cb;
}

export function requestAIInput() {
  _insertAIInput?.();
}

function AIInputElement(props: PlateElementProps) {
  const { element } = props;
  const editor = useEditorRef();
  const [value, setValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const removeNode = React.useCallback(() => {
    const path = editor.api.findPath(element);
    if (!path) return null;

    const point = editor.api.before(path) ?? editor.api.start(path);
    if (!point) return null;

    const pointRef = editor.api.pointRef(point);
    editor.tf.removeNodes({ at: path });

    const current = pointRef.current;
    pointRef.unref();

    if (current) editor.tf.select(current);
    return current;
  }, [editor, element]);

  const cancel = React.useCallback(() => {
    removeNode();
    editor.tf.focus();
  }, [editor, removeNode]);

  const submit = React.useCallback(async () => {
    const prompt = value.trim();
    if (!prompt || submitting) return;

    setSubmitting(true);
    const at = removeNode();
    await runAICommand(editor, prompt, at);
    setSubmitting(false);
  }, [editor, removeNode, submitting, value]);

  return (
    <PlateElement {...props} as="span">
      <span contentEditable={false} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 align-baseline dark:border-violet-800 dark:bg-violet-950/40">
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-indigo-500 text-[10px] text-white"
        >
          ✨
        </span>
        <input
          ref={inputRef}
          value={value}
          disabled={submitting}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          placeholder="Ask AI to write anything…"
          className="min-w-[12rem] flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </span>
      {props.children}
    </PlateElement>
  );
}
