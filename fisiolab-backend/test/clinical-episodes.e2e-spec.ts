import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { UserPayload } from '../src/modules/auth/strategies/jwt.strategy';
import { ClinicalEpisode, EstadoEpisodio } from '../src/modules/clinical-episodes/entities/clinical-episode.entity';
import { Patient, Genero } from '../src/modules/patients/entities/patient.entity';
import { TarjeteroIndice, EstadoTarjetero } from '../src/modules/tarjetero-indice/entities/tarjetero-indice.entity';

const PROF_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567890';

let mockUser: UserPayload = { userId: 'test-clerk-id', email: 'test@test.com', role: 'admin' };

const asAdmin = () => { mockUser = { ...mockUser, role: 'admin' }; };
const asMedico = () => { mockUser = { ...mockUser, role: 'medico' }; };
const asFisio = () => { mockUser = { ...mockUser, role: 'fisioterapeuta' }; };
const asPasante = () => { mockUser = { ...mockUser, role: 'pasante' }; };

describe('Clinical Episodes — EP1 Ciclo de vida', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = mockUser;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    ds = module.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async function seedPatient(tarjeteroEstado = EstadoTarjetero.ACTIVO): Promise<string> {
    const cedula = String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000);
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 90_000) + 1_000;

    const patient = await ds.getRepository(Patient).save({
      cedula,
      nombres: 'Test',
      apellidos: 'E2E',
      fechaNacimiento: new Date('1990-01-01'),
      genero: Genero.MASCULINO,
    });

    await ds.getRepository(TarjeteroIndice).save({
      codigoHc: `HC-${year}-${seq}`,
      pacienteId: patient.id,
      fechaApertura: new Date(),
      anioSecuencia: year,
      numeroSecuencia: seq,
      estado: tarjeteroEstado,
    });

    return patient.id;
  }

  async function seedEpisode(pid: string, estado: EstadoEpisodio, codigoCie10?: string): Promise<string> {
    const tarjetero = await ds.getRepository(TarjeteroIndice).findOneOrFail({ where: { pacienteId: pid } });

    const ep = await ds.getRepository(ClinicalEpisode).save({
      tarjeteroId: tarjetero.id,
      codigoHc: tarjetero.codigoHc,
      pacienteId: pid,
      profesionalId: PROF_ID,
      estado,
      motivoConsulta: 'Motivo de prueba E2E',
      codigoCie10: codigoCie10 ?? null,
      fechaApertura: new Date(),
      fechaCierre: estado === EstadoEpisodio.CERRADO || estado === EstadoEpisodio.ARCHIVADO ? new Date() : null,
      notaCierre: estado === EstadoEpisodio.CERRADO || estado === EstadoEpisodio.ARCHIVADO ? 'Cierre de prueba E2E' : null,
    });

    return ep.id;
  }

  async function clean(pid: string): Promise<void> {
    await ds.getRepository(ClinicalEpisode).delete({ pacienteId: pid });
    await ds.getRepository(TarjeteroIndice).delete({ pacienteId: pid });
    await ds.getRepository(Patient).delete(pid);
  }

  const base = (pid: string) => `/api/v1/patients/${pid}/episodes`;

  // ─── UAT-EP1-01: Abrir episodio exitoso ──────────────────────────────────────

  describe('UAT-EP1-01 — Abrir episodio exitoso', () => {
    let pid: string;

    beforeEach(async () => { pid = await seedPatient(); asFisio(); });
    afterEach(async () => { await clean(pid); });

    it('201 — estado abierto, fechaCierre null', async () => {
      const { body } = await request(app.getHttpServer())
        .post(base(pid))
        .send({ motivoConsulta: 'Dolor lumbar crónico', profesionalId: PROF_ID })
        .expect(201);

      expect(body.estado).toBe('abierto');
      expect(body.fechaCierre).toBeNull();
      expect(body.fechaApertura).toBeDefined();
    });
  });

  // ─── UAT-EP1-02: Múltiples episodios activos simultáneos ─────────────────────

  describe('UAT-EP1-02 — Múltiples episodios activos simultáneos', () => {
    let pid: string;

    beforeEach(async () => { pid = await seedPatient(); asMedico(); });
    afterEach(async () => { await clean(pid); });

    it('201 — permite segundo episodio con uno ya en_tratamiento', async () => {
      await seedEpisode(pid, EstadoEpisodio.EN_TRATAMIENTO);

      await request(app.getHttpServer())
        .post(base(pid))
        .send({ motivoConsulta: 'Dolor en mano derecha distinta al anterior', profesionalId: PROF_ID })
        .expect(201);

      const { body } = await request(app.getHttpServer()).get(base(pid)).expect(200);
      const activos = body.data.filter(
        (e: { estado: string }) => e.estado === 'abierto' || e.estado === 'en_tratamiento',
      );
      expect(activos.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── UAT-EP1-03: Tarjetero inactivo ──────────────────────────────────────────

  describe('UAT-EP1-03 — Tarjetero inactivo bloquea creación', () => {
    let pid: string;

    beforeEach(async () => { pid = await seedPatient(EstadoTarjetero.INACTIVO); asFisio(); });
    afterEach(async () => { await clean(pid); });

    it('422 — tarjetero inactivo', async () => {
      await request(app.getHttpServer())
        .post(base(pid))
        .send({ motivoConsulta: 'Dolor lumbar crónico', profesionalId: PROF_ID })
        .expect(422);
    });
  });

  // ─── UAT-EP1-05: Cierre de episodio ──────────────────────────────────────────

  describe('UAT-EP1-05 — Cierre de episodio', () => {
    let pid: string;
    let epId: string;

    beforeEach(async () => {
      pid = await seedPatient();
      epId = await seedEpisode(pid, EstadoEpisodio.EN_TRATAMIENTO);
      asMedico();
    });
    afterEach(async () => { await clean(pid); });

    it('200 — estado cerrado, fechaCierre seteada', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`${base(pid)}/${epId}/close`)
        .send({ notaCierre: 'Paciente dado de alta con mejoría clínica significativa.' })
        .expect(200);

      expect(body.estado).toBe('cerrado');
      expect(body.fechaCierre).not.toBeNull();
    });

    it('400 — PATCH con estado=cerrado bloqueado en DTO', async () => {
      await request(app.getHttpServer())
        .patch(`${base(pid)}/${epId}`)
        .send({ estado: 'cerrado' })
        .expect(400);
    });
  });

  // ─── UAT-EP1-06: Re-apertura de episodio cerrado ─────────────────────────────

  describe('UAT-EP1-06 — Re-apertura de episodio', () => {
    let pid: string;
    let epId: string;

    beforeEach(async () => {
      pid = await seedPatient();
      epId = await seedEpisode(pid, EstadoEpisodio.CERRADO);
      asMedico();
    });
    afterEach(async () => { await clean(pid); });

    it('200 — estado vuelve a abierto', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`${base(pid)}/${epId}/reopen`)
        .send({ motivoReapertura: 'Paciente regresa con recidiva de síntomas post alta médica.' })
        .expect(200);

      expect(body.estado).toBe('abierto');
    });

    it('422 — episodio no está cerrado', async () => {
      const abiertoId = await seedEpisode(pid, EstadoEpisodio.ABIERTO);

      await request(app.getHttpServer())
        .post(`${base(pid)}/${abiertoId}/reopen`)
        .send({ motivoReapertura: 'Paciente regresa con recidiva de síntomas post alta médica.' })
        .expect(422);
    });

    it('400 — motivoReapertura menor a 20 caracteres', async () => {
      await request(app.getHttpServer())
        .post(`${base(pid)}/${epId}/reopen`)
        .send({ motivoReapertura: 'Muy corto' })
        .expect(400);
    });

    it('200 — FISIOTERAPEUTA puede reabrir', async () => {
      asFisio();
      await request(app.getHttpServer())
        .post(`${base(pid)}/${epId}/reopen`)
        .send({ motivoReapertura: 'Paciente regresa con recidiva de síntomas post alta médica.' })
        .expect(200);
    });

    it('403 — PASANTE no puede reabrir', async () => {
      asPasante();
      await request(app.getHttpServer())
        .post(`${base(pid)}/${epId}/reopen`)
        .send({ motivoReapertura: 'Paciente regresa con recidiva de síntomas post alta médica.' })
        .expect(403);
    });
  });

  // ─── UAT-EP1-08: Archivar solo ADMIN ─────────────────────────────────────────

  describe('UAT-EP1-08 — Archivar episodio', () => {
    let pid: string;
    let epId: string;

    beforeEach(async () => {
      pid = await seedPatient();
      epId = await seedEpisode(pid, EstadoEpisodio.CERRADO);
    });
    afterEach(async () => { await clean(pid); });

    it('200 — ADMIN puede archivar episodio cerrado', async () => {
      asAdmin();
      const { body } = await request(app.getHttpServer())
        .patch(`${base(pid)}/${epId}`)
        .send({ estado: 'archivado' })
        .expect(200);

      expect(body.estado).toBe('archivado');
    });

    it('403 — MEDICO no puede archivar', async () => {
      asMedico();
      await request(app.getHttpServer())
        .patch(`${base(pid)}/${epId}`)
        .send({ estado: 'archivado' })
        .expect(403);
    });
  });

  // ─── UAT-EP1-09: Episodio archivado inmutable ────────────────────────────────

  describe('UAT-EP1-09 — Episodio archivado inmutable', () => {
    let pid: string;
    let epId: string;

    beforeEach(async () => {
      pid = await seedPatient();
      epId = await seedEpisode(pid, EstadoEpisodio.ARCHIVADO);
      asAdmin();
    });
    afterEach(async () => { await clean(pid); });

    it('422 — cualquier PATCH sobre episodio archivado', async () => {
      await request(app.getHttpServer())
        .patch(`${base(pid)}/${epId}`)
        .send({ motivoConsulta: 'Intento de edición post archivo' })
        .expect(422);
    });
  });

  // ─── UAT-EP1-B03: Filtro codigoCie10 ─────────────────────────────────────────

  describe('UAT-EP1-B03 — Filtro codigoCie10', () => {
    let pid: string;

    beforeEach(async () => { pid = await seedPatient(); asAdmin(); });
    afterEach(async () => { await clean(pid); });

    it('retorna solo episodios con el código exacto', async () => {
      await seedEpisode(pid, EstadoEpisodio.ABIERTO, 'M54.5');
      await seedEpisode(pid, EstadoEpisodio.ABIERTO, 'F32.1');

      const { body } = await request(app.getHttpServer())
        .get(`${base(pid)}?codigoCie10=M54.5`)
        .expect(200);

      expect(body.data).toHaveLength(1);
      expect(body.data[0].codigoCie10).toBe('M54.5');
    });

    it('match case-insensitive — m54.5 encuentra M54.5', async () => {
      await seedEpisode(pid, EstadoEpisodio.ABIERTO, 'M54.5');

      const { body } = await request(app.getHttpServer())
        .get(`${base(pid)}?codigoCie10=m54.5`)
        .expect(200);

      expect(body.data).toHaveLength(1);
    });

    it('sin filtro retorna todos los episodios', async () => {
      await seedEpisode(pid, EstadoEpisodio.ABIERTO, 'M54.5');
      await seedEpisode(pid, EstadoEpisodio.ABIERTO, 'F32.1');

      const { body } = await request(app.getHttpServer())
        .get(base(pid))
        .expect(200);

      expect(body.data.length).toBeGreaterThanOrEqual(2);
    });
  });
});
