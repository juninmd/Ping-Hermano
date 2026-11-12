import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
`;

/** <select> nativo mantido (acessibilidade e formulários), escondido visualmente. */
const Native = styled.select`
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); border: 0; white-space: nowrap;
`;

const Trigger = styled.button<{ $bare?: boolean }>`
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: ${p => (p.$bare ? '8px' : '8px 12px')};
  background: ${p => (p.$bare ? 'transparent' : 'var(--input)')};
  color: var(--fg); font: inherit; font-weight: 600;
  border: ${p => (p.$bare ? 'none' : '1px solid var(--line)')};
  &:hover { border-color: var(--accent); }
  svg { width: 12px; height: 12px; flex: none; stroke: var(--mute); fill: none; stroke-width: 2.4;
    transition: transform .25s; }
  &[aria-expanded='true'] svg { transform: rotate(180deg); stroke: var(--accent2); }
`;

const Menu = styled.div`
  position: fixed; z-index: 100; max-height: 260px; overflow: auto; padding: 5px;
  background: var(--overlay); border: 1px solid var(--line); border-radius: 12px;
  box-shadow: var(--shadow); animation: pop .18s cubic-bezier(.3,1.4,.5,1) both; transform-origin: top;
`;

const Option = styled.button<{ $hi: boolean; $sel: boolean }>`
  display: flex; align-items: center; width: 100%; padding: 8px 10px; border: 0; border-radius: 8px;
  text-align: left; color: var(--fg); font: inherit;
  background: ${p => (p.$hi ? 'var(--glow)' : 'transparent')};
  &::after { content: ${p => (p.$sel ? "'✓'" : "''")}; margin-left: auto; padding-left: 12px; color: var(--accent2); }
`;

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  bare?: boolean;
  width?: number | string;
  label?: string;
  colorFor?: (value: string) => string | undefined;
}

type Opt = { value: string; label: string };
const readOptions = (children: React.ReactNode): Opt[] =>
  React.Children.toArray(children).map((c: any) => ({ value: String(c.props.value), label: String(c.props.children) }));

export const Select: React.FC<Props> = ({ value, onChange, children, bare, width, label, colorFor }) => {
  const opts = readOptions(children);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState({ left: 0, top: 0, width: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const current = opts.find(o => o.value === value) ?? opts[0];

  const pick = (i: number) => {
    if (opts[i].value !== value) onChange({ target: { value: opts[i].value } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    trigger.current?.focus();
  };

  const toggle = () => {
    const r = trigger.current!.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 6, width: r.width });
    setHi(Math.max(0, opts.findIndex(o => o.value === value)));
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!trigger.current?.contains(e.target as Node) && !(e.target as Element).closest?.('[data-select-menu]')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', () => setOpen(false), { once: true });
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); toggle(); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => (h + 1) % opts.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => (h - 1 + opts.length) % opts.length); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(hi); }
    else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
  };

  return (
    <Wrap style={{ width }}>
      <Native value={value} onChange={onChange} aria-label={label} tabIndex={-1}>{children}</Native>
      <Trigger ref={trigger} type="button" data-select-trigger $bare={bare} aria-haspopup="listbox"
        aria-expanded={open} aria-label={label ? `${label}: ${current?.label}` : undefined}
        onClick={toggle} onKeyDown={onKey} style={{ color: colorFor?.(value) }}>
        <span>{current?.label}</span>
        <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
      </Trigger>
      {open && (
        <Menu data-select-menu role="listbox" style={{ left: pos.left, top: pos.top, minWidth: pos.width }}>
          {opts.map((o, i) => (
            <Option key={o.value} type="button" role="option" aria-selected={o.value === value}
              $hi={i === hi} $sel={o.value === value} onMouseEnter={() => setHi(i)}
              onClick={() => pick(i)} style={{ color: colorFor?.(o.value) }}>{o.label}</Option>
          ))}
        </Menu>
      )}
    </Wrap>
  );
};
