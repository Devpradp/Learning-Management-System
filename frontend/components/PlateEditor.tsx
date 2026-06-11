'use client';

import { useEffect } from 'react';
import {
  Plate, PlateContent, usePlateEditor,
  useMarkToolbarButton, useMarkToolbarButtonState,
} from 'platejs/react';
import { BasicMarksPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin, HeadingPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { SlashPlugin, SlashInputPlugin } from '@platejs/slash-command/react';
import { KEYS } from 'platejs';
import type { SlateEditor, Value } from 'platejs';

import { AIInputPlugin, AI_INPUT_KEY, setInsertAIInput } from './ui/ai-input-node';
import { SlashInputElement } from './ui/slash-node';

interface PlateEditorProps {
  readOnly?: boolean;
  value?: Value;
  onChange?: (value: Value) => void;
}

const EMPTY_VALUE: Value = [{ type: 'p', children: [{ text: '' }] }];

function canTriggerSlash(ed: SlateEditor) {
  if (!ed.selection) return false;

  const blockEntry = ed.api.block();
  if (blockEntry?.[0]?.type === ed.getType(KEYS.codeBlock)) return false;

  const [, blockPath] = blockEntry ?? [];
  if (!blockPath) return false;

  if (ed.api.isStart(ed.selection.anchor, blockPath)) return true;

  const blockStart = ed.api.start(blockPath);
  if (!blockStart) return false;

  const textBefore = ed.api.string(ed.api.range(blockStart, ed.selection));
  return /^\s*$/.test(textBefore);
}

// ─── Mark toolbar button ────────────────────────────────────────────────────

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
      aria-pressed={state.pressed ? 'true' : 'false'}
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

// ─── Main editor ────────────────────────────────────────────────────────────

export default function PlateEditor({ readOnly = false, value, onChange }: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BasicMarksPlugin,
      HeadingPlugin,
      ListPlugin,
      ...(readOnly ? [] : [
        SlashPlugin.configure({
          options: {
            triggerPreviousCharPattern: /^/,
            triggerQuery: canTriggerSlash,
          },
        }),
        SlashInputPlugin.withComponent(SlashInputElement),
        AIInputPlugin,
      ]),
    ],
    value: value && value.length > 0 ? value : EMPTY_VALUE,
  });

  useEffect(() => {
    if (readOnly) return;
    setInsertAIInput(() => {
      if (!editor.selection) return;
      editor.tf.insertNodes({ type: AI_INPUT_KEY, children: [{ text: '' }] });
    });
  }, [editor, readOnly]);

  return (
    <Plate
      editor={editor}
      readOnly={readOnly}
      onValueChange={({ value: v }) => onChange?.(v as Value)}
    >
      <div className="overflow-hidden rounded-md border border-zinc-200 focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-1 dark:border-zinc-700 dark:focus-within:ring-zinc-50">
        {!readOnly && (
          <div className="flex gap-1 border-b border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <MarkButton nodeType={BoldPlugin.key} label="B" ariaLabel="Toggle bold" className="font-bold" />
            <MarkButton nodeType={ItalicPlugin.key} label="I" ariaLabel="Toggle italic" className="italic" />
            <MarkButton nodeType={UnderlinePlugin.key} label="U" ariaLabel="Toggle underline" className="underline" />
          </div>
        )}
        <PlateContent
          style={{ minHeight: '480px' }}
          className="w-full bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
          placeholder={readOnly ? undefined : 'Write chapter content… (type / on a new line for AI)'}
        />
      </div>
    </Plate>
  );
}
