import { Injectable } from '@nestjs/common';
import { HeredofamiliarStrategy } from '../strategies/heredofamiliar.strategy';
import { PatologicoStrategy } from '../strategies/patologico.strategy';
import { NoPatologicoStrategy } from '../strategies/no-patologico.strategy';
import { GinecoStrategy } from '../strategies/gineco.strategy';
import { IAntecedentesStrategy } from '../strategies/antecedentes.strategy';

export enum AntecedenteTipo {
  HEREDOFAMILIAR = 'heredofamiliar',
  PATOLOGICO = 'patologico',
  NO_PATOLOGICO = 'no-patologico',
  GINECO_OBSTETRICO = 'gineco-obstetrico',
}

@Injectable()
export class AntecedentesFactory {
  private readonly strategies: Record<AntecedenteTipo, IAntecedentesStrategy<unknown, unknown>>;

  constructor(
    private readonly heredofamiliar: HeredofamiliarStrategy,
    private readonly patologico: PatologicoStrategy,
    private readonly noPatologico: NoPatologicoStrategy,
    private readonly gineco: GinecoStrategy,
  ) {
    this.strategies = {
      [AntecedenteTipo.HEREDOFAMILIAR]: this.heredofamiliar,
      [AntecedenteTipo.PATOLOGICO]: this.patologico,
      [AntecedenteTipo.NO_PATOLOGICO]: this.noPatologico,
      [AntecedenteTipo.GINECO_OBSTETRICO]: this.gineco,
    };
  }

  getStrategy(tipo: AntecedenteTipo): IAntecedentesStrategy<unknown, unknown> {
    return this.strategies[tipo];
  }
}
