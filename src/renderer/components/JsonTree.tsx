import React from 'react';
import styled from 'styled-components';

const Root = styled.div`
  font: 12.5px/1.7 'JetBrains Mono', Consolas, monospace; overflow: auto; flex: 1; padding: 4px 2px;
  details { margin-left: 16px; border-left: 1px dashed var(--line); padding-left: 10px; }
  summary { cursor: pointer; list-style: none; color: var(--accent2); }
  summary::before { content: '▸'; display: inline-block; width: 14px; color: var(--mute); transition: transform .2s; }
  details[open] > summary::before { transform: rotate(90deg); }
  .leaf { margin-left: 26px; }
  .s { color: var(--ok); } .n { color: var(--warn); } .b { color: var(--patch); }
`;

const Node: React.FC<{ name?: string; value: unknown }> = ({ name, value }) => {
  const key = name !== undefined ? <span style={{ color: 'var(--accent2)' }}>{name}: </span> : null;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as object);
    const arr = Array.isArray(value);
    return (
      <details open>
        <summary>{key}{arr ? `[${entries.length}]` : `{${entries.length}}`}</summary>
        {entries.map(([k, v]) => <Node key={k} name={k} value={v} />)}
      </details>
    );
  }
  const cls = typeof value === 'string' ? 's' : typeof value === 'number' ? 'n' : 'b';
  return <div className="leaf">{key}<span className={cls}>{JSON.stringify(value)}</span></div>;
};

/** Visualização recolhível de JSON; texto que não é JSON é mostrado como está. */
export const JsonTree: React.FC<{ data: unknown }> = ({ data }) => {
  let value = data;
  if (typeof data === 'string') {
    try { value = JSON.parse(data); } catch { return <Root>{data}</Root>; }
  }
  return <Root aria-label="JSON tree"><Node value={value} /></Root>;
};
