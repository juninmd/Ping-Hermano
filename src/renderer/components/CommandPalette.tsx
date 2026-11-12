import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { requestStore } from '../stores/RequestStore';

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 200; display: flex; justify-content: center; align-items: flex-start;
  padding: 12vh 16px 16px; background: rgba(4,5,14,.55); backdrop-filter: blur(6px);
  animation: pop .2s both;
`;
const Panel = styled.div`
  width: min(600px, 100%); background: var(--overlay); border: 1px solid var(--line);
  border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; animation: pop .3s cubic-bezier(.3,1.4,.5,1) both;
`;
const Input = styled.input`
  width: 100%; padding: 16px 18px; border: 0; border-bottom: 1px solid var(--line);
  background: transparent; color: var(--fg); font-size: 16px; outline: none; border-radius: 0;
  &:focus { box-shadow: none; }
`;
const List = styled.div`max-height: 50vh; overflow: auto; padding: 6px;`;
const Item = styled.button<{ $on: boolean }>`
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0;
  text-align: left; color: var(--fg); background: ${p => (p.$on ? 'var(--glow)' : 'transparent')};
  small { margin-left: auto; color: var(--mute); }
`;

export interface Command { label: string; hint?: string; run: () => void }

/** Comandos globais: nova aba, enviar, tema, ambientes e requisições salvas. */
export const buildCommands = (toggleTheme: () => void): Command[] => {
  const s = requestStore;
  return [
    { label: 'Nova requisição', run: () => s.addTab() },
    { label: 'Enviar requisição', hint: 'Ctrl Enter', run: () => s.sendRequest() },
    { label: 'Cancelar requisição', run: () => s.cancelRequest() },
    { label: 'Alternar tema', run: toggleTheme },
    { label: 'Limpar histórico', run: () => s.clearHistory() },
    ...s.environments.map(e => ({ label: `Ambiente: ${e.name}`, run: () => s.setActiveEnvironment(e.id) })),
    ...s.collections.flatMap(c => c.requests.map(r => ({
      label: `${r.method}  ${r.name || r.url}`, hint: c.name, run: () => { s.addTab(); s.loadHistoryItem(r); },
    }))),
  ];
};

interface Props { open: boolean; onClose: () => void; toggleTheme: () => void }

export const CommandPalette: React.FC<Props> = ({ open, onClose, toggleTheme }) => {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const list = useMemo(
    () => (open ? buildCommands(toggleTheme).filter(c => c.label.toLowerCase().includes(q.toLowerCase())) : []),
    [open, q, toggleTheme],
  );

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => ref.current?.focus(), 0); } }, [open]);
  if (!open) return null;

  const run = (c?: Command) => { if (c) { onClose(); c.run(); } };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') run(list[sel]);
    else if (e.key === 'Escape') onClose();
  };

  return (
    <Overlay onMouseDown={onClose}>
      <Panel role="dialog" aria-label="Paleta de comandos" onMouseDown={e => e.stopPropagation()}>
        <Input ref={ref} value={q} placeholder="Digite um comando ou o nome de uma requisição"
          aria-label="Buscar comandos" onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
        <List>
          {list.map((c, i) => (
            <Item key={c.label + i} $on={i === sel} onMouseEnter={() => setSel(i)} onClick={() => run(c)}>
              {c.label}{c.hint && <small>{c.hint}</small>}
            </Item>
          ))}
          {!list.length && <Item $on={false} disabled>Nada encontrado</Item>}
        </List>
      </Panel>
    </Overlay>
  );
};
