import type { Dataset } from './types';

/** Point d'entrée unique des données : remplacer cette fonction pour brancher une vraie source. */
export interface DataSource {
  load(): Promise<Dataset>;
}

export const demoSource: DataSource = {
  async load() {
    const mod = await import('./demo-needs.json');
    return mod.default as unknown as Dataset;
  },
};
