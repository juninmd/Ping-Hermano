import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

/** Versão do app, injetada no build a partir do package.json (sincronizado com tauri.conf.json). */
export const APP_VERSION: string = __APP_VERSION__;

export interface AvailableUpdate {
  version: string;
  notes: string;
  /** Baixa, instala e reinicia o app; `onProgress` recebe 0-100 quando o tamanho é conhecido. */
  install: (onProgress: (percent: number) => void) => Promise<void>;
}

/** Consulta o latest.json da última release; null quando já está atualizado. */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  const update = await check();
  if (!update) return null;
  return {
    version: update.version,
    notes: update.body ?? '',
    install: async onProgress => {
      let total = 0;
      let received = 0;
      await update.downloadAndInstall(event => {
        if (event.event === 'Started') total = event.data.contentLength ?? 0;
        if (event.event === 'Progress') {
          received += event.data.chunkLength;
          if (total) onProgress(Math.min(100, Math.round((received / total) * 100)));
        }
      });
      await relaunch();
    },
  };
}
