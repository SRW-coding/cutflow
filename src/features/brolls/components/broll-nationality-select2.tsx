import { useEffect, useRef } from 'react';
import 'select2/dist/css/select2.css';
import { cn } from '@/shared/ui/cn';
import {
  BROLL_NATIONALITY_OPTIONS,
  type BrollNationalityOption,
} from '@/features/brolls/components/broll-filter-model';
import { $ } from '@/features/brolls/components/select2-jquery';

type BrollNationalitySelect2Props = {
  value: string[];
  onChange: (nationalities: string[]) => void;
  isDark: boolean;
  className?: string;
  hasSelection?: boolean;
};

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((entry, index) => entry === right[index]);
}

function labelForValue(value: string): string {
  return BROLL_NATIONALITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function dropdownCssClass(isDark: boolean): string {
  const theme = isDark
    ? 'broll-nationality-select2__dropdown--dark'
    : 'broll-nationality-select2__dropdown--light';
  return ['broll-nationality-select2__dropdown', theme].join(' ');
}

function getSelectedValues($select: JQuery<HTMLElement>): string[] {
  const raw = ($select.val() as string[] | string | null) ?? [];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

function renderDropdownSelectedPanel($select: JQuery<HTMLElement>) {
  const instance = $select.data('select2') as { $dropdown?: JQuery<HTMLElement> } | undefined;
  const $dropdown = instance?.$dropdown;
  if (!$dropdown?.length) return;

  $dropdown.find('.broll-nationality-selected-panel').remove();

  const selected = getSelectedValues($select);
  if (selected.length === 0) return;

  const $panel = $('<div class="broll-nationality-selected-panel" role="list"></div>');

  selected.forEach((value) => {
    const $chip = $(`
      <button type="button" class="broll-nationality-selected-chip" data-value="${value}">
        <span>${labelForValue(value)}</span>
        <span aria-hidden="true">×</span>
      </button>
    `);

    $chip.on('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    $chip.on('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = selected.filter((entry) => entry !== value);
      $select.val(next).trigger('change');
      renderDropdownSelectedPanel($select);
    });

    $panel.append($chip);
  });

  $dropdown.find('.select2-results').before($panel);
}

function syncFieldLabel($select: JQuery<HTMLElement>) {
  const $rendered = $select.next('.select2-container').find('.select2-selection__rendered');
  let $label = $rendered.find('.broll-nationality-field-label');

  if (!$label.length) {
    $label = $('<li class="broll-nationality-field-label"></li>');
    $rendered.prepend($label);
  }

  const selected = getSelectedValues($select);
  const text =
    selected.length === 0
      ? 'Any'
      : selected.length === 1
        ? labelForValue(selected[0])
        : `${selected.length} selected`;

  $label.html(`<span class="select2-selection__placeholder">${text}</span>`);
}

export function BrollNationalitySelect2({
  value,
  onChange,
  isDark,
  className,
  hasSelection = false,
}: BrollNationalitySelect2Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const element = selectRef.current;
    if (!element) return;

    const $select = $(element);
    $select.select2({
      placeholder: 'Any',
      allowClear: false,
      width: '100%',
      closeOnSelect: false,
      dropdownParent: $(rootRef.current ?? document.body),
      dropdownCssClass: dropdownCssClass(isDark),
      dropdownAutoWidth: false,
      templateSelection: (data: { id: string; text: string }) => {
        if (!data.id) return data.text;
        return '';
      },
    });

    const handleChange = () => {
      const normalized = getSelectedValues($select);
      syncFieldLabel($select);
      renderDropdownSelectedPanel($select);
      onChangeRef.current(normalized);
    };

    const handleOpen = () => {
      renderDropdownSelectedPanel($select);
    };

    const handleClose = () => {
      $select.data('select2')?.$dropdown?.find('.broll-nationality-selected-panel').remove();
    };

    $select.on('change', handleChange);
    $select.on('select2:open', handleOpen);
    $select.on('select2:close', handleClose);
    syncFieldLabel($select);

    return () => {
      $select.off('change', handleChange);
      $select.off('select2:open', handleOpen);
      $select.off('select2:close', handleClose);
      handleClose();
      if ($select.data('select2')) {
        $select.select2('destroy');
      }
    };
  }, [isDark]);

  useEffect(() => {
    const element = selectRef.current;
    if (!element || !$(element).data('select2')) return;

    const $select = $(element);
    const current = getSelectedValues($select);
    if (arraysEqual(current, value)) return;
    $select.val(value).trigger('change.select2');
    syncFieldLabel($select);
  }, [value]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'broll-nationality-select2',
        isDark ? 'broll-nationality-select2--dark' : 'broll-nationality-select2--light',
        hasSelection && 'broll-nationality-select2--selected',
        className,
      )}
    >
      <select
        ref={selectRef}
        multiple
        className="w-full"
        aria-label="Filter by nationality"
      >
        {BROLL_NATIONALITY_OPTIONS.map((option: BrollNationalityOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
