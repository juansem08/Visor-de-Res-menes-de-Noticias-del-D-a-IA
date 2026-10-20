export interface NewsItem {
  id: number;
  titular: string;
  categoria: string;
  fuente: string;
  resumen: string;
  tiempo: string;
  leidoEn?: string;
}

export type VistaActual = 'feed' | 'ajustes' | 'historial';
