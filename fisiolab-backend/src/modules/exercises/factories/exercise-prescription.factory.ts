import { TipoEjercicio } from '../entities/exercise.entity';
import { ExercisePrescriptionStrategy } from '../interfaces/exercise-prescription.strategy';
import { RepeticionStrategy } from '../strategies/repeticion.strategy';
import { TiempoStrategy } from '../strategies/tiempo.strategy';
import { CardioStrategy } from '../strategies/cardio.strategy';
import { LibreStrategy } from '../strategies/libre.strategy';

export class ExercisePrescriptionFactory {
  private static readonly registry = new Map<TipoEjercicio, ExercisePrescriptionStrategy>([
    [TipoEjercicio.REPETICIONES, new RepeticionStrategy()],
    [TipoEjercicio.TIEMPO, new TiempoStrategy()],
    [TipoEjercicio.CARDIO, new CardioStrategy()],
    [TipoEjercicio.LIBRE, new LibreStrategy()],
  ]);

  static get(tipo: TipoEjercicio): ExercisePrescriptionStrategy {
    return (
      ExercisePrescriptionFactory.registry.get(tipo) ??
      ExercisePrescriptionFactory.registry.get(TipoEjercicio.LIBRE)!
    );
  }

  static formatPrescripcion(exercise: {
    tipoEjercicio: TipoEjercicio;
    series?: number | null;
    repeticiones?: number | null;
    duracionSegundos?: number | null;
  }): string {
    return ExercisePrescriptionFactory.get(exercise.tipoEjercicio).formatPrescripcion(exercise);
  }
}
