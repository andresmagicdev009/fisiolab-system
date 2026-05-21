export type RangoMovimiento = Record<string, number>;

export type FuerzaMuscular = Record<string, number>;

export interface PruebaEspecifica {
  resultado: 'positivo' | 'negativo' | 'dudoso';
  notas?: string;
}

export type PruebasEspecificas = Record<string, PruebaEspecifica>;
