import { ExercisePrescriptionStrategy } from '../interfaces/exercise-prescription.strategy';
import { TipoEjercicio } from '../entities/exercise.entity';

export class LibreStrategy implements ExercisePrescriptionStrategy {
  readonly tipo = TipoEjercicio.LIBRE;

  validate(_fields: unknown): void {
    // no constraints
  }

  formatPrescripcion(_e: unknown): string {
    return 'Libre';
  }
}
