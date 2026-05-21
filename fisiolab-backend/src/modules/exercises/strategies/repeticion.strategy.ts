import { UnprocessableEntityException } from '@nestjs/common';
import { ExercisePrescriptionStrategy } from '../interfaces/exercise-prescription.strategy';
import { TipoEjercicio } from '../entities/exercise.entity';

export class RepeticionStrategy implements ExercisePrescriptionStrategy {
  readonly tipo = TipoEjercicio.REPETICIONES;

  validate(fields: { series?: number; repeticiones?: number }): void {
    if (!fields.series && !fields.repeticiones) {
      throw new UnprocessableEntityException(
        'Ejercicio tipo REPETICIONES requiere al menos series o repeticiones',
      );
    }
  }

  formatPrescripcion(e: { series?: number | null; repeticiones?: number | null }): string {
    if (e.series && e.repeticiones) return `${e.series} × ${e.repeticiones} reps`;
    if (e.series) return `${e.series} series`;
    if (e.repeticiones) return `${e.repeticiones} reps`;
    return 'Sin prescripción';
  }
}
