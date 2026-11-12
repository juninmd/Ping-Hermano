import React, { useEffect } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { updaterStore } from '../stores/UpdaterStore';

const SIX_HOURS = 6 * 60 * 60 * 1000;

const Dock = styled.div`
  position: fixed; right: 62px; bottom: 16px; z-index: 20; display: flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 12px; border-radius: 18px; font-size: 12px;
  background: var(--surface2); border: 1px solid var(--line); backdrop-filter: blur(12px);
  animation: rise .5s both;
`;

const Version = styled.span`font-family: 'JetBrains Mono', monospace; color: var(--mute);`;

const Available = styled.button`
  display: inline-flex; align-items: center; gap: 6px; border: 0; padding: 4px 10px; color: #fff;
  font-weight: 600; background: linear-gradient(135deg, var(--accent), var(--accent2));
  box-shadow: 0 0 0 0 var(--glow); animation: update-pulse 2s infinite;
  @keyframes update-pulse { 70% { box-shadow: 0 0 0 8px transparent; } }
  &:disabled { animation: none; cursor: progress; }
`;

const Bar = styled.i<{ $p: number }>`
  width: 60px; height: 4px; border-radius: 2px; background: var(--line); position: relative; overflow: hidden;
  &::after { content: ''; position: absolute; inset: 0; width: ${p => p.$p}%; background: var(--accent2); transition: width .3s; }
`;

/** Mostra a versão instalada, a versão disponível na release do GitHub e o botão de atualizar. */
export const UpdateBadge = observer(() => {
  const { currentVersion, status, availableVersion, progress, error } = updaterStore;

  useEffect(() => {
    updaterStore.check();
    const id = setInterval(() => updaterStore.check(), SIX_HOURS);
    return () => clearInterval(id);
  }, []);

  return (
    <Dock role="status" aria-live="polite">
      <Version title="Versão instalada">v{currentVersion}</Version>
      {status === 'checking' && <span style={{ color: 'var(--mute)' }}>Verificando…</span>}
      {status === 'uptodate' && <span style={{ color: 'var(--ok)' }}>Atualizado</span>}
      {status === 'error' && <span style={{ color: 'var(--mute)' }} title={error}>Sem verificação</span>}
      {(status === 'available' || status === 'downloading') && (
        <Available onClick={() => updaterStore.install()} disabled={status === 'downloading'}
          title="Baixar, instalar e reiniciar">
          {status === 'downloading'
            ? <>Baixando {progress ? `${progress}%` : '…'} <Bar $p={progress} /></>
            : <>v{availableVersion} disponível · Atualizar</>}
        </Available>
      )}
    </Dock>
  );
});
