import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { AntecedentesHeredofamiliar } from '../antecedentes/entities/antecedentes-heredofamiliar.entity';
import { AntecedentesPatologico } from '../antecedentes/entities/antecedentes-patologico.entity';
import { AntecedentesNoPatologico } from '../antecedentes/entities/antecedentes-no-patologico.entity';
import { AntecedentesGineco } from '../antecedentes/entities/antecedentes-gineco.entity';
import { SoapNote } from '../soap-notes/entities/soap-note.entity';
import { PhysicalEvaluation } from '../physical-evaluations/entities/physical-evaluation.entity';
import { TreatmentPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { Exercise } from '../treatment-plans/entities/exercise.entity';
import { Session } from '../sessions/entities/session.entity';
import { Interconsult } from '../interconsults/entities/interconsult.entity';

// ─── Response types ───────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'EPISODIO_ABIERTO'
  | 'EPISODIO_CERRADO'
  | 'SOAP'
  | 'EVALUACION'
  | 'SESION'
  | 'CITA';

export interface TimelineItem {
  fecha: string;
  tipo: TimelineEventType;
  episodeId: string | null;
  codigoHc: string | null;
  descripcion: string;
  referenceId: string;
}

interface EpisodeCountRow {
  id: string;
  soap_count: number;
  eval_count: number;
  plan_count: number;
  session_count: number;
  interconsult_count: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class HistoriaClinicaService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(TarjeteroIndice)
    private readonly tarjeteroRepo: Repository<TarjeteroIndice>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(AntecedentesHeredofamiliar)
    private readonly heredoRepo: Repository<AntecedentesHeredofamiliar>,
    @InjectRepository(AntecedentesPatologico)
    private readonly patologicoRepo: Repository<AntecedentesPatologico>,
    @InjectRepository(AntecedentesNoPatologico)
    private readonly noPatRepo: Repository<AntecedentesNoPatologico>,
    @InjectRepository(AntecedentesGineco)
    private readonly ginecoRepo: Repository<AntecedentesGineco>,
    @InjectRepository(SoapNote)
    private readonly soapRepo: Repository<SoapNote>,
    @InjectRepository(PhysicalEvaluation)
    private readonly evalRepo: Repository<PhysicalEvaluation>,
    @InjectRepository(TreatmentPlan)
    private readonly planRepo: Repository<TreatmentPlan>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Interconsult)
    private readonly interconsultRepo: Repository<Interconsult>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Resumen completo ─────────────────────────────────────────────────────

  async getResumen(patientId: string) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const [tarjetero, episodios, heredo, patologico, noPat, gineco, counts] = await Promise.all([
      this.tarjeteroRepo.findOne({ where: { pacienteId: patientId } }),
      this.episodeRepo.find({
        where: { pacienteId: patientId },
        order: { fechaApertura: 'DESC' },
      }),
      this.heredoRepo.findOne({ where: { patientId } }),
      this.patologicoRepo.findOne({ where: { patientId } }),
      this.noPatRepo.findOne({ where: { patientId } }),
      this.ginecoRepo.findOne({ where: { patientId } }),
      this.dataSource.query<EpisodeCountRow[]>(`
        SELECT
          e.id,
          COUNT(DISTINCT sn.id)::int  AS soap_count,
          COUNT(DISTINCT pe.id)::int  AS eval_count,
          COUNT(DISTINCT tp.id)::int  AS plan_count,
          COUNT(DISTINCT s.id)::int   AS session_count,
          COUNT(DISTINCT ic.id)::int  AS interconsult_count
        FROM clinical_episodes e
        LEFT JOIN soap_notes          sn ON sn.episode_id = e.id
        LEFT JOIN physical_evaluations pe ON pe.episode_id = e.id
        LEFT JOIN treatment_plans     tp ON tp.episode_id = e.id
        LEFT JOIN sessions             s  ON s.episode_id  = e.id
        LEFT JOIN interconsults        ic ON ic.episode_id = e.id
        WHERE e.patient_id = $1
        GROUP BY e.id
      `, [patientId]),
    ]);

    const countMap = new Map(counts.map(r => [r.id, r]));

    const episodiosConContadores = episodios.map(ep => {
      const c = countMap.get(ep.id);
      return {
        ...ep,
        _counts: {
          soapNotes:     c?.soap_count     ?? 0,
          evaluaciones:  c?.eval_count     ?? 0,
          planes:        c?.plan_count     ?? 0,
          sesiones:      c?.session_count  ?? 0,
          interconsultas: c?.interconsult_count ?? 0,
        },
      };
    });

    const totals = episodiosConContadores.reduce(
      (acc, ep) => ({
        episodios:    acc.episodios + 1,
        soapNotes:    acc.soapNotes    + ep._counts.soapNotes,
        evaluaciones: acc.evaluaciones + ep._counts.evaluaciones,
        planes:       acc.planes       + ep._counts.planes,
        sesiones:     acc.sesiones     + ep._counts.sesiones,
      }),
      { episodios: 0, soapNotes: 0, evaluaciones: 0, planes: 0, sesiones: 0 },
    );

    return {
      paciente: patient,
      tarjetero:  tarjetero  ?? null,
      antecedentes: {
        heredofamiliares:  heredo     ?? null,
        patologicos:       patologico ?? null,
        noPatologicos:     noPat      ?? null,
        ginecoObstetricos: gineco     ?? null,
      },
      episodios: episodiosConContadores,
      _totals: totals,
    };
  }

  // ─── Episodio completo ────────────────────────────────────────────────────

  async getEpisodioCompleto(patientId: string, episodeId: string) {
    const episodio = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episodio) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    const [soapNotes, evaluaciones, planes, episodioSesiones, interconsultas] = await Promise.all([
      this.soapRepo.find({ where: { episodeId }, order: { numeroSesion: 'ASC' } }),
      this.evalRepo.find({ where: { episodeId }, order: { numeroEvaluacion: 'ASC' } }),
      this.planRepo.find({ where: { episodeId }, order: { numeroPlan: 'ASC' } }),
      this.sessionRepo.find({ where: { episodeId }, order: { numeroSesion: 'ASC' } }),
      this.interconsultRepo.find({ where: { episodeId }, order: { createdAt: 'ASC' } }),
    ]);

    let planesConDetalle: any[] = planes;
    if (planes.length > 0) {
      const planIds = planes.map(p => p.id);
      const [exercises] = await Promise.all([
        this.exerciseRepo.find({ where: { planId: In(planIds) }, order: { orden: 'ASC' } }),
      ]);
      const exercisesByPlan = new Map<string, Exercise[]>();
      const sessionsByPlan  = new Map<string, Session[]>();

      for (const ex of exercises) {
        const list = exercisesByPlan.get(ex.planId) ?? [];
        list.push(ex);
        exercisesByPlan.set(ex.planId, list);
      }
      for (const s of episodioSesiones) {
        if (!s.planId) continue;
        const list = sessionsByPlan.get(s.planId) ?? [];
        list.push(s);
        sessionsByPlan.set(s.planId, list);
      }

      planesConDetalle = planes.map(plan => ({
        ...plan,
        exercises: exercisesByPlan.get(plan.id) ?? [],
        sesiones:  sessionsByPlan.get(plan.id)  ?? [],
      }));
    }

    return {
      episodio,
      soapNotes,
      evaluaciones,
      planes: planesConDetalle,
      interconsultas,
      // sesiones sin plan
      sesionesLibres: episodioSesiones.filter(s => s.planId === null),
    };
  }

  // ─── Timeline ─────────────────────────────────────────────────────────────

  async getTimeline(
    patientId: string,
    opts: { desde?: string; hasta?: string; tipos?: TimelineEventType[]; limit?: number },
  ): Promise<TimelineItem[]> {
    await this.assertPatientExists(patientId);

    const rows = await this.dataSource.query<TimelineItem[]>(`
      SELECT fecha, tipo, episode_id AS "episodeId", codigo_hc AS "codigoHc", descripcion, reference_id AS "referenceId"
      FROM (
        SELECT
          fecha_apertura::date::text                     AS fecha,
          'EPISODIO_ABIERTO'                             AS tipo,
          id::text                                       AS episode_id,
          codigo_hc,
          LEFT(motivo_consulta, 120)                     AS descripcion,
          id::text                                       AS reference_id
        FROM clinical_episodes WHERE patient_id = $1

        UNION ALL

        SELECT
          fecha_cierre::date::text                       AS fecha,
          'EPISODIO_CERRADO'                             AS tipo,
          id::text                                       AS episode_id,
          codigo_hc,
          COALESCE(LEFT(nota_cierre, 120), 'Episodio cerrado') AS descripcion,
          id::text                                       AS reference_id
        FROM clinical_episodes
        WHERE patient_id = $1 AND fecha_cierre IS NOT NULL

        UNION ALL

        SELECT
          fecha_sesion::date::text                       AS fecha,
          'SOAP'                                         AS tipo,
          episode_id::text,
          codigo_hc,
          CONCAT('Nota SOAP #', numero_sesion)           AS descripcion,
          id::text                                       AS reference_id
        FROM soap_notes WHERE patient_id = $1

        UNION ALL

        SELECT
          fecha_evaluacion::date::text                   AS fecha,
          'EVALUACION'                                   AS tipo,
          episode_id::text,
          codigo_hc,
          CONCAT('Evaluación física #', numero_evaluacion) AS descripcion,
          id::text                                       AS reference_id
        FROM physical_evaluations WHERE patient_id = $1

        UNION ALL

        SELECT
          fecha_sesion::date::text                       AS fecha,
          'SESION'                                       AS tipo,
          episode_id::text,
          codigo_hc,
          CONCAT('Sesión ', tipo, ' #', numero_sesion, ' (', estado, ')') AS descripcion,
          id::text                                       AS reference_id
        FROM sessions WHERE patient_id = $1

        UNION ALL

        SELECT
          scheduled_at::date::text                       AS fecha,
          'CITA'                                         AS tipo,
          episode_id::text,
          NULL::varchar                                  AS codigo_hc,
          CONCAT(tipo_cita, ' · ', estado)               AS descripcion,
          id::text                                       AS reference_id
        FROM appointments WHERE patient_id = $1
      ) t
      WHERE
        ($2::date IS NULL OR fecha::date >= $2::date)
        AND ($3::date IS NULL OR fecha::date <= $3::date)
      ORDER BY fecha DESC, tipo ASC
      LIMIT $4
    `, [
      patientId,
      opts.desde ?? null,
      opts.hasta ?? null,
      opts.limit ?? 200,
    ]);

    if (opts.tipos?.length) {
      return rows.filter(r => opts.tipos!.includes(r.tipo as TimelineEventType));
    }
    return rows;
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async assertPatientExists(patientId: string): Promise<void> {
    const exists = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
    if (!exists) throw new NotFoundException(`Paciente ${patientId} no encontrado`);
  }
}
