'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';
import type { TComboboxInputElement } from 'platejs';
import { PlateElement } from 'platejs/react';

import { requestAIInput } from './ai-input-node';
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxGroup>
            <InlineComboboxGroupLabel>AI</InlineComboboxGroupLabel>

            <InlineComboboxItem
              value="AI"
              focusEditor={false}
              group="AI"
              onClick={() => {
                requestAIInput();
              }}
            >
              <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs">
                ✨
              </span>
              <div>
                <p className="font-medium">AI</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Ask AI to write anything</p>
              </div>
            </InlineComboboxItem>
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
