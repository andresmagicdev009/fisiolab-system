import { UnprocessableEntityException } from '@nestjs/common';
import { ExercisePrescriptionStrategy } from '../interfaces/exercise-prescription.strategy';
import { TipoEjercicio } from '../entities/exercise.entity';

export class TiempoStrategy implements ExercisePrescriptionStrategy {
  readonly tipo = TipoEjercicio.TIEMPO;

  validate(fields: { duracionSegundos?: number }): void {
    if (!fields.duracionSegundos) {
      throw new UnprocessableEntityException(
        'Ejercicio tipo TIEMPO requiere duracion_segundos',
      );
    }
  }

  formatPrescripcion(e: {
    series?: number | null;
    duracionSegundos?: number | null;
  }): string {
    if (!e.duracionSegundos) return 'Sin duración';
    const s = e.duracionSegundos;
    const label = s >= 60
      ? `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}`
      : `${s}s`;
    return e.series ? `${e.series} × ${label}` : label;
  }
}
