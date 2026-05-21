import { TipoEjercicio } from '../entities/exercise.entity';

export interface ExercisePrescriptionStrategy {
  readonly tipo: TipoEjercicio;
  validate(fields: { series?: number; repeticiones?: number; duracionSegundos?: number }): void;
  formatPrescripcion(exercise: {
    series?: number | null;
    repeticiones?: number | null;
    duracionSegundos?: number | null;
  }): string;
}
