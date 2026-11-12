import { makeAutoObservable, runInAction } from 'mobx';
import { APP_VERSION, checkForUpdate, AvailableUpdate } from '../api/updater';

export type UpdateStatus = 'idle' | 'checking' | 'uptodate' | 'available' | 'downloading' | 'error';

/** Estado do auto-update: versão atual, versão disponível e progresso da instalação. */
export class UpdaterStore {
  currentVersion = APP_VERSION;
  status: UpdateStatus = 'idle';
  availableVersion: string | null = null;
  notes = '';
  progress = 0;
  error = '';
  private pending: AvailableUpdate | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async check() {
    if (this.status === 'checking' || this.status === 'downloading') return;
    this.status = 'checking';
    try {
      const update = await checkForUpdate();
      runInAction(() => {
        this.pending = update;
        this.availableVersion = update?.version ?? null;
        this.notes = update?.notes ?? '';
        this.status = update ? 'available' : 'uptodate';
      });
    } catch (e: any) {
      // Fora do Tauri (navegador) ou sem rede: não incomoda o usuário.
      runInAction(() => { this.status = 'error'; this.error = String(e?.message ?? e); });
    }
  }

  async install() {
    if (!this.pending || this.status === 'downloading') return;
    this.status = 'downloading';
    this.progress = 0;
    try {
      await this.pending.install(p => runInAction(() => { this.progress = p; }));
    } catch (e: any) {
      runInAction(() => { this.status = 'error'; this.error = String(e?.message ?? e); });
    }
  }
}

export const updaterStore = new UpdaterStore();
