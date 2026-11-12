import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdaterStore } from './UpdaterStore';
import * as api from '../api/updater';

vi.mock('../api/updater', () => ({ APP_VERSION: '2.0.0', checkForUpdate: vi.fn() }));
const check = vi.mocked(api.checkForUpdate);

describe('UpdaterStore', () => {
  beforeEach(() => { check.mockReset(); });

  it('expõe a versão instalada', () => {
    expect(new UpdaterStore().currentVersion).toBe('2.0.0');
  });

  it('marca atualizado quando não há release nova', async () => {
    check.mockResolvedValue(null);
    const s = new UpdaterStore();
    await s.check();
    expect(s.status).toBe('uptodate');
    expect(s.availableVersion).toBeNull();
  });

  it('expõe a versão disponível e as notas', async () => {
    check.mockResolvedValue({ version: '2.1.0', notes: 'novidades', install: vi.fn() });
    const s = new UpdaterStore();
    await s.check();
    expect(s.status).toBe('available');
    expect(s.availableVersion).toBe('2.1.0');
    expect(s.notes).toBe('novidades');
  });

  it('registra erro de verificação sem lançar', async () => {
    check.mockImplementation(() => Promise.reject(new Error('offline')));
    const s = new UpdaterStore();
    await s.check();
    expect(s.status).toBe('error');
    expect(s.error).toBe('offline');
  });

  it('ignora verificação simultânea', async () => {
    check.mockResolvedValue(null);
    const s = new UpdaterStore();
    await Promise.all([s.check(), s.check()]);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('instala acompanhando o progresso', async () => {
    const install = vi.fn(async (cb: (p: number) => void) => { cb(40); cb(100); });
    check.mockResolvedValue({ version: '2.1.0', notes: '', install });
    const s = new UpdaterStore();
    await s.check();
    await s.install();
    expect(install).toHaveBeenCalled();
    expect(s.progress).toBe(100);
    expect(s.status).toBe('downloading');
  });

  it('volta para erro se a instalação falhar', async () => {
    check.mockResolvedValue({ version: '2.1.0', notes: '', install: async () => { throw new Error('assinatura inválida'); } });
    const s = new UpdaterStore();
    await s.check();
    await s.install();
    expect(s.status).toBe('error');
    expect(s.error).toBe('assinatura inválida');
  });

  it('não instala sem atualização pendente', async () => {
    const s = new UpdaterStore();
    await s.install();
    expect(s.status).toBe('idle');
  });
});
