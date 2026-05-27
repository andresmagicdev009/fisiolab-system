# FisioLab — Contexto del Proyecto

Sistema de gestión clínica fisioterapéutica para Ecuador. Maneja historia clínica completa, episodios, citas, tratamientos, pagos y archivos.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS + TypeORM + PostgreSQL (Neon) |
| Cache | Redis (Upstash REST) |
| Auth | Clerk (JWKS RS256) |
| Storage | Cloudflare R2 (presigned URLs) |
| Frontend | React 18 + TypeScript + Chakra UI v2 |
| State (FE) | React Query v5 + React Hook Form v7 |
| Router (FE) | React Router v6 |
| Auth (FE) | Clerk |

---

## Repositorios / Carpetas

```
fisiolab-system/
  fisiolab-backend/   — NestJS API
  fisiolab-ui/        — React frontend
  CONTEXT.md          — este archivo
```

---

## Backend

### Configuración global (`main.ts`)

- Prefix: `api/v1`
- ValidationPipe: `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` → campo extra en body = **400 inmediato**
- ClassSerializerInterceptor global
- CORS: variable `CORS_ORIGINS` (comma-separated)
- Swagger: `GET /api/docs`
- Health: `GET /api/v1/health` → `{ status, timestamp, version, services: { database, redis } }`

### Variables de entorno (`.env.example`)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...neon.tech/dbname?sslmode=require
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CLERK_JWT_PUBLIC_KEY=...
R2_ENDPOINT=https://...r2.cloudflarestorage.com
R2_ACCOUNT_ID=...
R2_BUCKET_NAME=fisiolab-files
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

### Roles

```typescript
enum UserRole {
  ADMIN          = 'admin'
  MEDICO         = 'medico'
  FISIOTERAPEUTA = 'fisioterapeuta'
  PASANTE        = 'pasante'
  PACIENTE       = 'paciente'
}
```

Convención en controllers:
- `READERS = [ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE]`
- `WRITERS = [ADMIN, MEDICO, FISIOTERAPEUTA]`

### Redis — TTLs

```typescript
TTL.LIST   = 300s   // colecciones
TTL.RECORD = 600s   // registros individuales
TTL.USER   = 900s   // usuarios Clerk (cambian poco)
```

Cache keys en `src/common/redis/cache-keys.ts` — patrón `CK.RESOURCE_ID(id)`.

### Errores HTTP estándar

| Status | Causa |
|--------|-------|
| 400 | Validación body / params inválidos |
| 401 | Token ausente, expirado o firma inválida |
| 403 | Rol insuficiente |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicados, solapamiento) |
| 422 | Regla de negocio violada |

---

## Módulos Backend (20 módulos)

### 1. `auth`
- JWT guard via Clerk JWKS (RS256)
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- `@CurrentUser()` → `{ userId: clerkId, role }`

### 2. `users`
- CRUD usuarios profesionales
- Webhook Clerk: `POST /api/v1/users/webhook/clerk` (público)
- `findByExternalId(clerkId)` — usado por otros servicios para resolver clerkId → dbUser

### 3. `patients`
- CRUD completo + paginación + filtros
- Validación cédula ecuatoriana (algoritmo módulo 10)
- `GET /patients?page=1&limit=100` → `{ data, meta: { total, page, limit, pages } }`
- `limit` máximo = 100

### 4. `audit`
- Interceptor global `@Auditable('ACCION')` → guarda en `audit_logs`
- Registra: userId, acción, método HTTP, path, IP, userAgent

### 5. `antecedentes`
- Strategy + Factory pattern, 4 tipos independientes
- Redis cache por tipo + paciente
- Constraint gineco: solo se muestra/edita si `paciente.genero === 'femenino'` (validado en app layer)

**Rutas:**
```
GET|PATCH /api/v1/patients/:id/antecedentes/heredofamiliares
GET|PATCH /api/v1/patients/:id/antecedentes/patologicos
GET|PATCH /api/v1/patients/:id/antecedentes/no-patologicos
GET|PATCH /api/v1/patients/:id/antecedentes/gineco-obstetricos
GET       /api/v1/patients/:id/antecedentes   → { heredofamiliares, patologicos, noPatologicos, ginecoObstetricos }
```

`GET` individual usa `findOrCreate`. `GET` all usa `findByPatient` (puede retornar null).

### 6. `tarjetero-indice`
- Código HC auto-generado: `HC-YYYY-NNNN`
- 1 tarjetero por paciente (POST dos veces → 409)
- `codigoHc` inmutable
- Tarjetero `archivado` bloquea episodios futuros

**Estados:** `activo | inactivo | archivado`

**Rutas:**
```
POST  /api/v1/patients/:id/tarjetero        — crear (prerequisito para episodios)
GET   /api/v1/patients/:id/tarjetero
PATCH /api/v1/patients/:id/tarjetero
GET   /api/v1/tarjetero                     — lista global paginada
GET   /api/v1/tarjetero/by-codigo/:codigo
```

### 7. `clinical-episodes`
- Contenedor de historia clínica (episodio = un caso clínico)
- Prerequisito: paciente debe tener tarjetero `activo`
- **N episodios activos simultáneos permitidos** (hombro + mano = episodios distintos)

**Máquina de estados:**
```
abierto → en_tratamiento → cerrado → archivado (solo admin)
```
- `POST /close` con `{ notaCierre }` para cerrar (no usar PATCH)
- Primera nota SOAP auto-transiciona `abierto → en_tratamiento`

**Rutas:**
```
POST  /api/v1/patients/:id/episodes
GET   /api/v1/patients/:id/episodes
GET   /api/v1/patients/:id/episodes/:eid
PATCH /api/v1/patients/:id/episodes/:eid
POST  /api/v1/patients/:id/episodes/:eid/close
GET   /api/v1/episodes                          — lista global
```

### 8. `soap-notes`
- JSONB para los 4 campos (subjetivo, objetivo, analisis, plan)
- `numeroSesion` atómico MAX+1 por episodio (no enviarlo en body)
- Solo autor o admin puede editar (PATCH)

**Rutas:**
```
POST  /api/v1/patients/:pid/episodes/:eid/soap
GET   /api/v1/patients/:pid/episodes/:eid/soap
GET   /api/v1/patients/:pid/episodes/:eid/soap/:sid
PATCH /api/v1/patients/:pid/episodes/:eid/soap/:sid
```

### 9. `physical-evaluations`
- JSONB: ROM, fuerza MRC, pruebas específicas
- `numeroEvaluacion` atómico por episodio
- Solo autor o admin puede editar

**Rutas:**
```
POST  /api/v1/patients/:pid/episodes/:eid/evaluations
GET   /api/v1/patients/:pid/episodes/:eid/evaluations
GET   /api/v1/patients/:pid/episodes/:eid/evaluations/:evid
PATCH /api/v1/patients/:pid/episodes/:eid/evaluations/:evid
```

### 10. `treatment-plans`
- `numeroPlan` atómico por episodio
- Progreso auto-calculado desde `sessions`: `MIN(100, completadas/estimadas × 100)`
- `sesionesEstimadas = frecuenciaSemanal × duracionEstimadaSemanas`
- Si algún campo null → progreso queda manual

**Rutas:**
```
POST  /api/v1/patients/:pid/episodes/:eid/plans
GET   /api/v1/patients/:pid/episodes/:eid/plans
GET   /api/v1/patients/:pid/episodes/:eid/plans/:planId
PATCH /api/v1/patients/:pid/episodes/:eid/plans/:planId
POST  /api/v1/patients/:pid/episodes/:eid/plans/:planId/reorder
```

### 11. `exercises`
- Hijos de `treatment-plans`, ordenados por `orden`
- Strategy Pattern: `TipoEjercicio: REPETICIONES | TIEMPO | CARDIO | LIBRE`

**Rutas:**
```
POST   /api/v1/plans/:planId/exercises
GET    /api/v1/plans/:planId/exercises
GET    /api/v1/plans/:planId/exercises/:exId
PATCH  /api/v1/plans/:planId/exercises/:exId
DELETE /api/v1/plans/:planId/exercises/:exId
```

### 12. `sessions`
- Evento clínico abstracto — vincula plan ↔ artefactos
- `numeroSesion` atómico por plan
- Artefactos tienen FK `session_id NULL` hacia `sessions` (no al revés)

**Tipos:** `FISIOTERAPIA | EVALUACION_FISICA | INTERCONSULTA | CONSULTA_MEDICA`

**Máquina de estados:**
```
PROGRAMADA → EN_CURSO (auto al vincular artefacto)
EN_CURSO   → COMPLETADA (manual PATCH)
PROGRAMADA | EN_CURSO → CANCELADA
COMPLETADA → inmutable
```

**Rutas:**
```
POST  /api/v1/patients/:pid/episodes/:eid/plans/:planId/sessions
GET   /api/v1/patients/:pid/episodes/:eid/plans/:planId/sessions
GET   /api/v1/patients/:pid/episodes/:eid/plans/:planId/sessions/:sid
PATCH /api/v1/patients/:pid/episodes/:eid/plans/:planId/sessions/:sid
DELETE /api/v1/patients/:pid/episodes/:eid/plans/:planId/sessions/:sid  — solo ADMIN + solo PROGRAMADA
GET   /api/v1/patients/:pid/episodes/:eid/sessions                       — todas del episodio
```

### 13. `appointments`
- Conflict detection: profesional no puede tener citas solapadas
- Prerequisito crear: paciente con tarjetero `activo`
- `scheduledAt` no puede ser en el pasado

**Tipos de cita:** `PRIMERA_VEZ | SEGUIMIENTO | INTERCONSULTA`

**Máquina de estados:**
```
CONFIRMADA → COMPLETADA    (POST /:id/complete)
CONFIRMADA → CANCELADA     (POST /:id/cancel)
CONFIRMADA → REPROGRAMADA  (POST /:id/reschedule — crea nueva cita CONFIRMADA)
CONFIRMADA → NO_ASISTIO    (POST /:id/no-show — sin cobro)
```
Todos los estados finales son inmutables. PATCH solo funciona en `CONFIRMADA`.

**Completar cita — 3 casos:**
- Caso 1 (`PRIMERA_VEZ`, sin episodeId): crea `session_payment`, episodeId null
- Caso 2 (con episodeId, sin planId): crea `session_payment`, vincula episodio
- Caso 3 (con episodeId + planId): crea `session_payment` + auto-crea `Session` FISIOTERAPIA

**Reprogramar:** crea nueva cita `CONFIRMADA`, original → `REPROGRAMADA`. Pessimistic lock en transacción.

**Scoping por rol en GET:**
- ADMIN / PASANTE → ven todas
- MEDICO / FISIOTERAPEUTA → solo las suyas

**Rutas:**
```
POST  /api/v1/appointments
GET   /api/v1/appointments
GET   /api/v1/appointments/:id
PATCH /api/v1/appointments/:id
POST  /api/v1/appointments/:id/cancel
POST  /api/v1/appointments/:id/complete         → { appointment, sessionId }
POST  /api/v1/appointments/:id/reschedule       → { original, nueva }
POST  /api/v1/appointments/:id/no-show
GET   /api/v1/patients/:pid/appointments        — lista enriquecida (episode, session, payment, cadena reprog)
```

### 14. `interconsults`
- Estado machine: `SOLICITADA → EN_PROCESO → RESPONDIDA`
- Validación: solicitante ≠ destinatario
- FK `session_id NULL` → sessions

**Rutas:**
```
POST  /api/v1/interconsults
GET   /api/v1/interconsults
GET   /api/v1/interconsults/:id
PATCH /api/v1/interconsults/:id
```

### 15. `patient-files`
- Abstract Provider Pattern → Cloudflare R2
- Presigned URLs 15min
- Max 20MB, tipos: PDF/JPEG/PNG/TIFF/DICOM
- Categorías: `laboratorio | imagen | referencia | consentimiento | receta | otro`

**Rutas:**
```
POST  /api/v1/patients/:pid/files
GET   /api/v1/patients/:pid/files
GET   /api/v1/patients/:pid/files/:fid
DELETE /api/v1/patients/:pid/files/:fid
```

### 16. `prescriptions` + `medications`
- Builder Pattern
- Solo `MEDICO | ADMIN` puede crear
- `firmaDigital` → inmutabilidad (no se puede editar receta firmada)
- `numeroPrescripcion` atómico

**Rutas:**
```
POST  /api/v1/patients/:pid/prescriptions
GET   /api/v1/patients/:pid/prescriptions
GET   /api/v1/patients/:pid/prescriptions/:rxId
PATCH /api/v1/patients/:pid/prescriptions/:rxId
```

### 17. `session-payments`
- State Pattern
- Auto-creado por `appointments.complete()` (estado PENDIENTE)
- Solo `ADMIN | MEDICO` puede emitir facturas

**Máquina de estados:**
```
PENDIENTE → PAGADO
PENDIENTE → PARCIAL
PARCIAL   → PAGADO
PAGADO    → terminal
```

**Rutas:**
```
GET   /api/v1/patients/:pid/payments
GET   /api/v1/session-payments/:id
PATCH /api/v1/session-payments/:id
```

### 18. `invoices`
- Inmutables — no se pueden editar una vez emitidas
- Validación: RUC 13 dígitos, claveAcceso 49 dígitos, numeroFactura `001-001-000000001`

**Rutas:**
```
POST /api/v1/invoices
GET  /api/v1/invoices/:id
GET  /api/v1/patients/:pid/invoices
```

### 19. `historia-clinica`
- Módulo read-only de consulta agregada (sin entidad/migración propia)
- Agrega datos de múltiples módulos en una sola llamada

**Rutas:**
```
GET /api/v1/patients/:pid/historia-clinica
    → paciente + tarjetero + antecedentes(4) + episodios con _counts{soapNotes, evaluaciones, planes, sesiones, interconsultas} + _totals

GET /api/v1/patients/:pid/historia-clinica/episodios/:eid
    → episodio + soapNotes + evaluaciones + planes{exercises[], sesiones[]} + interconsultas + sesionesLibres

GET /api/v1/patients/:pid/timeline
    → UNION SQL: episodios+SOAP+evaluaciones+sesiones+citas ordenados DESC
    Query: desde?, hasta?, tipos[]?, limit?(max 500, default 200)
    Tipos: EPISODIO_ABIERTO | EPISODIO_CERRADO | SOAP | EVALUACION | SESION | CITA
```

---

## Migraciones (orden)

| # | Timestamp | Nombre |
|---|-----------|--------|
| 1 | 1747440000000 | CreateUsers |
| 2 | 1747440001000 | CreateAuditLogs |
| 3 | 1747440002000 | CreatePatients |
| 4 | 1747440003000 | AddProfessionalFieldsToUsers |
| 5 | 1747440004000 | DecouplePatientFromUser |
| 6 | 1747440005000 | CreateAntecedentes |
| 7 | 1747440006000 | CreateTarjeteroIndice |
| 8 | 1747440007000 | CreateClinicalEpisodes |
| 9 | 1747440008000 | CreateSoapNotes |
| 10 | 1747440009000 | CreatePhysicalEvaluations |
| 11 | 1747440010000 | CreateTreatmentPlans |
| 12 | 1747440011000 | CreateAppointments |
| 13 | 1747440012000 | CreateInterconsults |
| 14 | 1747440013000 | CreateSessions |
| 15 | 1747440014000 | AddSessionIdToArtifacts |
| 16 | 1747440015000 | AddAppointmentIdToTreatmentPlans |
| 17 | 1747440016000 | AddTipoEjercicioToExercises |
| 18 | 1747440017000 | CreatePatientFiles |
| 19 | 1747440018000 | CreatePrescriptions |
| 20 | 1747440019000 | CreateInvoices |
| 21 | 1747440020000 | AddRescheduleFieldsToAppointments |

**Bugs conocidos de migraciones (2026-05-18):**
- `CREATE TYPE IF NOT EXISTS` NO existe en PostgreSQL — usar `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`
- `CREATE TABLE IF NOT EXISTS` sí existe (pg 9.1+)
- TypeORM requiere `type: 'varchar'` explícito en columnas nullable — sin él infiere `Object` → `DataTypeNotSupportedError`
- Tablas creadas manualmente antes de TypeORM → fix: `INSERT INTO migrations(timestamp, name)`

---

## Patrones de diseño usados

| Patrón | Módulo |
|--------|--------|
| Strategy + Factory | `antecedentes`, `exercises`, `session-payments`, `appointments` (estados) |
| Builder | `prescriptions` |
| Abstract Provider | `patient-files` (storage) |
| State Machine | `clinical-episodes`, `sessions`, `appointments`, `session-payments`, `interconsults` |
| Cache-aside (Redis) | `patients`, `users`, `antecedentes`, `tarjetero-indice`, `episodes`, `soap-notes`, `appointments`, etc. |

---

## Relaciones clave entre módulos

```
Patient
  └── TarjeteroIndice (1:1, prerequisito para episodios)
  └── ClinicalEpisode[] (N episodios activos simultáneos PERMITIDOS)
        └── SoapNote[]          (numeroSesion atómico por episodio)
        └── PhysicalEvaluation[] (numeroEvaluacion atómico por episodio)
        └── TreatmentPlan[]     (numeroPlan atómico por episodio)
              └── Exercise[]    (ordenados por campo `orden`)
              └── Session[]     (vincula plan ↔ artefactos)
        └── Interconsult[]
        └── Session[]           (sesiones libres sin plan)
  └── Appointment[]
        └── SessionPayment (auto-creado al completar)
              └── Invoice (emitida por admin/médico)
  └── PatientFile[]
  └── Prescription[]
  └── Antecedentes (4 tipos independientes)
```

---

## Frontend (fisiolab-ui)

**Stack:** React 18, TypeScript, Chakra UI v2, Framer Motion, React Query v5, React Hook Form v7, Yup, Clerk, Axios, TanStack Table v8, React Router v6.

**Auth:** Clerk + token template `fisiolab-sudo`. Interceptor en `apiClient.ts` inyecta `Authorization: Bearer <token>`.

**baseURL:** `${REACT_APP_API_URL}/api/v1`

### Archivos clave

```
src/
  services/
    apiClient.ts           — baseURL + interceptor auth
    patientService.ts      — getAll: { page:1, limit:100 }, extrae data.data
    antecedenteService.ts
    tarjeteroService.ts    — getByPatient, create, update
    episodeService.ts      — createEpisode, listByPatient, getEpisode, updateEpisode, closeEpisode
    soapService.ts         — create, list, get, update (por episode)
    evaluationService.ts
    planService.ts         — create, list, get, update, reorder
    appointmentService.ts  — CRUD + cancel + complete + reschedule + noShow
    sessionService.ts      — listByPlan, getById, create, update, delete
    userService.ts         — listProfessionals
  hooks/
    usePatients.ts
    useAntecedentes.ts     — useAntecedentesResumen + useXxx + useUpdateXxx por tipo
    useTarjetero.ts        — useTarjetero (skip retry 404), useCreateTarjetero, useUpdateTarjetero
    useEpisodes.ts
    useSoap.ts
    useEvaluations.ts
    usePlans.ts
    useAppointments.ts     — useAppointmentsByPatient, useCreateAppointment, useCancelAppointment, useCompleteAppointment, useRescheduleAppointment, useNoShowAppointment
    useSessions.ts
    useCurrentUser.ts      — useCurrentDbUser
    useUsers.ts            — useProfessionals
  types/
    models.ts              — todos los tipos + enums
  views/admin/patients/
    index.tsx              — lista paginada con stats y búsqueda
    PatientDetail.tsx      — layout 2 columnas (360px sticky / 1fr)
  layouts/patients/
    PatientCard.tsx        — avatar degradado por género + CopyButton
    AntecedentesPanel.tsx  — acordeón 4 secciones, gineco oculto si género ≠ FEMENINO
    TarjeteroCard.tsx      — badge HC monospace, estado chip, crear/editar
    TarjeteroModal.tsx
    PatientTabs.tsx        — 5 tabs
    CitasTab.tsx           — CRUD citas completo: cancel/complete/reschedule/no-show
    HistoriaClinicaTab.tsx — TIMELINE vertical (dot + línea) por episodio, filtros
    EvaluacionesTab.tsx
    TratamientoTab.tsx
    EpisodeActiveCard.tsx  — props: headerless?, noBorder?
    EpisodeSoapSection.tsx — últimas 3 notas + expand, noBorder?
    SessionFormModal.tsx
    AppointmentCard.tsx    — badges REPROGRAMADA/NO_ASISTIO + cadena reprog
    AppointmentFormModal.tsx — 3 casos en complete (CASO 1/2/3)
    AppointmentCancelModal.tsx
    AppointmentCompleteModal.tsx
```

### Vista detalle paciente

Layout 2 columnas: `360px` sticky (PatientCard + TarjeteroCard + AntecedentesPanel) / `1fr` (PatientTabs).

**Tabs:**
1. Citas ✅
2. Historia Clínica ✅ — timeline redesign
3. Evaluaciones ✅
4. Tratamiento ✅
5. Pagos — placeholder "PRÓXIMAMENTE"

### Onboarding BPMN (flujo nuevo paciente)

```
POST /patients → 201
  └── auto-POST /patients/:id/tarjetero {}
        ├── 201 → tarjeta creada
        └── fallo ≠ 409 → toast warning (no bloquea)
```

---

## Reglas de negocio críticas

1. **N episodios activos**: paciente puede tener múltiples episodios `abierto`/`en_tratamiento` simultáneos. NUNCA buscar "el episodio activo" como si fuera único.
2. **Tarjetero prerequisito**: sin tarjetero `activo` no se pueden crear episodios ni citas.
3. **`codigoHc` inmutable**: nunca mostrar campo editable.
4. **ValidationPipe strict**: `forbidNonWhitelisted: true` — campo extra en body → 400.
5. **Antecedentes gineco**: solo mostrar/editar si `paciente.genero === 'femenino'`.
6. **Autores**: solo el autor o admin puede editar SOAP notes y evaluaciones físicas.
7. **Prescripciones firmadas**: `firmaDigital` hace la receta inmutable.
8. **Facturas inmutables**: no se pueden editar post-emisión.
9. **Episodios cerrados**: PATCH lanza 422. Usar `POST /close` con `notaCierre`.
10. **SEGUIMIENTO/INTERCONSULTA**: `episodeId` requerido al completar cita.

---

## Docs existentes

```
docs/
  API.md                        — referencia rápida endpoints
  bpmn_appointments.txt         — flujo BPMN citas
  bpmn_historia_clinica.txt     — flujo BPMN historia clínica
  bpmn_onboarding_paciente.txt  — flujo BPMN onboarding
  modules/
    antecedentes.md, appointments.md, auth.md, billing.md,
    clinical-episodes.md, exercises.md, interconsults.md,
    patient-files.md, patients.md, physical-evaluations.md,
    prescriptions.md, sessions.md, soap-notes.md,
    tarjetero-indice.md, treatment-plans.md, users.md
```

---

## Pendientes conocidos

- **Tab Pagos (frontend)**: placeholder "PRÓXIMAMENTE" — conectar con `session-payments` + `invoices`
- **Vista global `/tarjetero`**: listado paginado GET `/api/v1/tarjetero` (backend listo, falta vista)
- **Formulario MSP 028**: historia clínica en formato oficial Ecuador (pendiente diseño)
