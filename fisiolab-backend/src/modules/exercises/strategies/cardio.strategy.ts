import { UnprocessableEntityException } from '@nestjs/common';
import { ExercisePrescriptionStrategy } from '../interfaces/exercise-prescription.strategy';
import { TipoEjercicio } from '../entities/exercise.entity';

export class CardioStrategy implements ExercisePrescriptionStrategy {
  readonly tipo = TipoEjercicio.CARDIO;

  validate(fields: { duracionSegundos?: number }): void {
    if (!fields.duracionSegundos) {
      throw new UnprocessableEntityException(
        'Ejercicio tipo CARDIO requiere duracion_segundos',
      );
    }
  }

  formatPrescripcion(e: { duracionSegundos?: number | null }): string {
    if (!e.duracionSegundos) return 'Sin duración';
    const mins = Math.ceil(e.duracionSegundos / 60);
    return `${mins} min cardio`;
  }
}
