'use client';

import { Plate, PlateContent, usePlateEditor } from '@udecode/plate/react';
import { BasicMarksPlugin } from '@udecode/plate-basic-marks/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { ListPlugin } from '@udecode/plate-list/react';
import type { Value } from '@udecode/slate';

interface PlateEditorProps {
  readOnly?: boolean;
  value?: Value;
  onChange?: (value: Value) => void;
}

const EMPTY_VALUE: Value = [{ type: 'p', children: [{ text: '' }] }];

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
      <PlateContent
        className="min-h-[240px] w-full rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-50"
        placeholder="Write chapter content…"
      />
    </Plate>
  );
}
