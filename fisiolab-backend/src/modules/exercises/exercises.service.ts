import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { TreatmentPlan, EstadoPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK } from '../../common/redis/cache-keys';
import { Exercise, TipoEjercicio } from './entities/exercise.entity';
import { ExercisePrescriptionFactory } from './factories/exercise-prescription.factory';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ReorderExercisesDto } from './dto/reorder-exercises.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(TreatmentPlan)
    private readonly planRepo: Repository<TreatmentPlan>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  async listExercises(
    patientId: string,
    episodeId: string,
    planId: string,
  ): Promise<Exercise[]> {
    await this.assertEpisodeExists(patientId, episodeId);
    await this.assertPlanExists(planId, episodeId);

    return this.exerciseRepo.find({
      where: { planId },
      order: { orden: 'ASC' },
    });
  }

  async createExercise(
    patientId: string,
    episodeId: string,
    planId: string,
    dto: CreateExerciseDto,
  ): Promise<Exercise> {
    await this.getActiveEpisode(patientId, episodeId);
    await this.getActivePlan(planId, episodeId);

    const tipo = dto.tipoEjercicio ?? TipoEjercicio.REPETICIONES;
    ExercisePrescriptionFactory.get(tipo).validate({
      series: dto.series,
      repeticiones: dto.repeticiones,
      duracionSegundos: dto.duracionSegundos,
    });

    const result = await this.exerciseRepo.query<{ max: number | null }[]>(
      `SELECT MAX(orden) as max FROM exercises WHERE plan_id = $1`,
      [planId],
    );
    const orden = (result[0]?.max ?? 0) + 1;

    const exercise = this.exerciseRepo.create({
      planId,
      tipoEjercicio: tipo,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      series: dto.series ?? null,
      repeticiones: dto.repeticiones ?? null,
      duracionSegundos: dto.duracionSegundos ?? null,
      orden,
      observaciones: dto.observaciones ?? null,
    });

    const saved = await this.exerciseRepo.save(exercise);
    await this.redis.del(CK.PLAN_ID(planId));
    return saved;
  }

  async updateExercise(
    patientId: string,
    episodeId: string,
    planId: string,
    exId: string,
    dto: UpdateExerciseDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Exercise> {
    await this.getActiveEpisode(patientId, episodeId);
    const plan = await this.getActivePlan(planId, episodeId);
    await this.assertAuthorOrAdmin(plan.profesionalId, clerkUserId, userRole);

    const exercise = await this.exerciseRepo.findOne({ where: { id: exId, planId } });
    if (!exercise) throw new NotFoundException(`Ejercicio ${exId} no encontrado`);

    const newTipo = dto.tipoEjercicio ?? exercise.tipoEjercicio;
    ExercisePrescriptionFactory.get(newTipo).validate({
      series: dto.series ?? exercise.series ?? undefined,
      repeticiones: dto.repeticiones ?? exercise.repeticiones ?? undefined,
      duracionSegundos: dto.duracionSegundos ?? exercise.duracionSegundos ?? undefined,
    });

    if (dto.tipoEjercicio !== undefined) exercise.tipoEjercicio = dto.tipoEjercicio;
    if (dto.nombre !== undefined) exercise.nombre = dto.nombre;
    if (dto.descripcion !== undefined) exercise.descripcion = dto.descripcion;
    if (dto.series !== undefined) exercise.series = dto.series;
    if (dto.repeticiones !== undefined) exercise.repeticiones = dto.repeticiones;
    if (dto.duracionSegundos !== undefined) exercise.duracionSegundos = dto.duracionSegundos;
    if (dto.observaciones !== undefined) exercise.observaciones = dto.observaciones;

    const saved = await this.exerciseRepo.save(exercise);
    await this.redis.del(CK.PLAN_ID(planId));
    return saved;
  }

  async deleteExercise(
    patientId: string,
    episodeId: string,
    planId: string,
    exId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    await this.getActiveEpisode(patientId, episodeId);
    const plan = await this.getActivePlan(planId, episodeId);
    await this.assertAuthorOrAdmin(plan.profesionalId, clerkUserId, userRole);

    const exercise = await this.exerciseRepo.findOne({ where: { id: exId, planId } });
    if (!exercise) throw new NotFoundException(`Ejercicio ${exId} no encontrado`);

    await this.exerciseRepo.remove(exercise);
    await this.redis.del(CK.PLAN_ID(planId));
  }

  async reorderExercises(
    patientId: string,
    episodeId: string,
    planId: string,
    dto: ReorderExercisesDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Exercise[]> {
    await this.getActiveEpisode(patientId, episodeId);
    const plan = await this.getActivePlan(planId, episodeId);
    await this.assertAuthorOrAdmin(plan.profesionalId, clerkUserId, userRole);

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.orden) {
        await manager.update(Exercise, { id: item.id, planId }, { orden: item.orden });
      }
    });

    await this.redis.del(CK.PLAN_ID(planId));

    return this.exerciseRepo.find({
      where: { planId },
      order: { orden: 'ASC' },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async getActiveEpisode(patientId: string, episodeId: string): Promise<ClinicalEpisode> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta modificaciones`,
      );
    }
    return episode;
  }

  private async assertEpisodeExists(patientId: string, episodeId: string): Promise<void> {
    const ep = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!ep) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
  }

  private async getActivePlan(planId: string, episodeId: string): Promise<TreatmentPlan> {
    const plan = await this.planRepo.findOne({ where: { id: planId, episodeId } });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);
    if (plan.estado !== EstadoPlan.ACTIVO) {
      throw new UnprocessableEntityException(`Plan ${plan.estado} — ejercicios inmutables`);
    }
    return plan;
  }

  private async assertPlanExists(planId: string, episodeId: string): Promise<void> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, episodeId },
      select: ['id'],
    });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);
  }

  private async assertAuthorOrAdmin(
    authorId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'admin') return;
    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser || dbUser.id !== authorId) {
      throw new ForbiddenException('Solo el autor o admin puede modificar este recurso');
    }
  }
}
