import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInAction } from 'mobx';
import { UpdateBadge } from './UpdateBadge';
import { updaterStore } from '../stores/UpdaterStore';

vi.mock('../api/updater', () => ({ APP_VERSION: '2.0.0', checkForUpdate: vi.fn().mockResolvedValue(null) }));

const set = (patch: Partial<typeof updaterStore>) => runInAction(() => Object.assign(updaterStore, patch));

describe('UpdateBadge', () => {
  beforeEach(() => set({ status: 'idle', availableVersion: null, progress: 0 }));

  it('mostra a versão instalada e verifica ao abrir', async () => {
    await act(async () => { render(<UpdateBadge />); });
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    expect(screen.getByText('Atualizado')).toBeInTheDocument();
  });

  it('mostra a versão disponível e instala ao clicar', async () => {
    const install = vi.spyOn(updaterStore, 'install').mockResolvedValue();
    await act(async () => { render(<UpdateBadge />); });
    act(() => set({ status: 'available', availableVersion: '2.1.0' }));
    fireEvent.click(screen.getByText(/v2\.1\.0 disponível/));
    expect(install).toHaveBeenCalled();
  });

  it('mostra o progresso do download', async () => {
    await act(async () => { render(<UpdateBadge />); });
    act(() => set({ status: 'downloading', availableVersion: '2.1.0', progress: 42 }));
    expect(screen.getByText(/Baixando 42%/)).toBeInTheDocument();
  });

  it('indica quando não foi possível verificar', async () => {
    await act(async () => { render(<UpdateBadge />); });
    act(() => set({ status: 'error' }));
    expect(screen.getByText('Sem verificação')).toBeInTheDocument();
  });
});
