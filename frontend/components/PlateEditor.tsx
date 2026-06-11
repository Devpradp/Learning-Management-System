'use client';

import { Plate, PlateContent, usePlateEditor, useMarkToolbarButton, useMarkToolbarButtonState } from 'platejs/react';
import { BasicMarksPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin, HeadingPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
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
        (state.pressed
          ? ' bg-zinc-200 dark:bg-zinc-700'
          : '') +
        (className ? ' ' + className : '')
      }
      type="button"
    >
      {label}
    </button>
  );
}

export default function PlateEditor({ readOnly = false, value, onChange }: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: [BasicMarksPlugin, HeadingPlugin, ListPlugin],
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
      <PlateContent
        className="min-h-[240px] w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-50"
        placeholder="Write chapter content…"
      />
    </Plate>
  );
}
