'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plate, PlateContent, usePlateEditor, useMarkToolbarButton, useMarkToolbarButtonState, useEditorPlugin, usePluginOption } from 'platejs/react';
import { BasicMarksPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin, HeadingPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { AIPlugin, AIChatPlugin } from '@platejs/ai/react';
import type { Value } from 'platejs';

interface PlateEditorProps {
  readOnly?: boolean;
  value?: Value;
  onChange?: (value: Value) => void;
}

const EMPTY_VALUE: Value = [{ type: 'p', children: [{ text: '' }] }];

interface MarkButtonProps {
  nodeType: string;
  label: string;
  ariaLabel: string;
  className?: string;
}

function MarkButton({ nodeType, label, ariaLabel, className = '' }: MarkButtonProps) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);

  return (
    <button
      {...props}
      aria-label={ariaLabel}
      aria-pressed={state.pressed}
      className={
        'rounded px-2 py-0.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800' +
        (state.pressed ? ' bg-zinc-200 dark:bg-zinc-700' : '') +
        (className ? ' ' + className : '')
      }
      type="button"
    >
      {label}
    </button>
  );
}

function AIPromptPanel() {
  const { editor } = useEditorPlugin(AIChatPlugin);
  const open = usePluginOption(AIChatPlugin, 'open');
  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setInput('');
      // defer focus so the panel is mounted first
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open]);

  const hide = useCallback(() => {
    editor.setOption(AIChatPlugin, 'open', false);
  }, [editor]);

  const submit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt) return;

    hide();
    editor.tf.focus();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text) editor.tf.insertText(text);
      }
    } catch {
      // AbortError or network failure — silent
    } finally {
      abortRef.current = null;
    }
  }, [editor, hide, input]);

  if (!open) return null;

  return (
    <div className="flex items-center gap-2 border-b border-purple-100 bg-purple-50 px-3 py-2 dark:border-purple-900/40 dark:bg-purple-950/30">
      <span className="shrink-0 text-xs font-semibold text-purple-600 dark:text-purple-400">
        Ask AI
      </span>
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); void submit(); }
          if (e.key === 'Escape') hide();
        }}
        placeholder="What would you like to write?"
        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
      />
      <button
        onClick={() => void submit()}
        disabled={!input.trim()}
        className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-purple-600 hover:bg-purple-100 disabled:opacity-30 dark:text-purple-400 dark:hover:bg-purple-900/40"
        type="button"
      >
        Generate
      </button>
      <button
        onClick={hide}
        className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        type="button"
        aria-label="Close AI prompt"
      >
        ✕
      </button>
    </div>
  );
}

export default function PlateEditor({ readOnly = false, value, onChange }: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BasicMarksPlugin,
      HeadingPlugin,
      ListPlugin,
      ...(readOnly ? [] : [
        AIPlugin,
        AIChatPlugin.configure({ options: { trigger: '/' } }),
      ]),
    ],
    value: value && value.length > 0 ? value : EMPTY_VALUE,
  });

  return (
    <Plate
      editor={editor}
      readOnly={readOnly}
      onValueChange={({ value: v }) => onChange?.(v as Value)}
    >
      {!readOnly && (
        <div className="flex gap-1 border-b border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
          <MarkButton nodeType={BoldPlugin.key} label="B" ariaLabel="Toggle bold" className="font-bold" />
          <MarkButton nodeType={ItalicPlugin.key} label="I" ariaLabel="Toggle italic" className="italic" />
          <MarkButton nodeType={UnderlinePlugin.key} label="U" ariaLabel="Toggle underline" className="underline" />
        </div>
      )}
      {!readOnly && <AIPromptPanel />}
      <PlateContent
        className="min-h-[240px] w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-50"
        placeholder="Write chapter content… (type / in an empty line to ask AI)"
      />
    </Plate>
  );
}
