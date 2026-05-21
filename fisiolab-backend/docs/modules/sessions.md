# Módulo: Sessions (Sesiones Clínicas)

Base path: `/api/v1`

> Una **Sesión** es el evento clínico ejecutado dentro de un plan de tratamiento (o directamente en un episodio). Es la entidad central de progreso: el plan avanza cuando sus sesiones se completan. El *contenido clínico* de una sesión vive en artefactos especializados vinculados por `sessionId`.

---

## Relación con otros módulos

```
TreatmentPlan ──── OneToMany ──→ Session
                                     │
                          tipo discrimina artefacto
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                       ▼
          SoapNote          PhysicalEvaluation         Interconsult
       (FISIOTERAPIA)      (EVALUACION_FISICA)       (INTERCONSULTA)
```

- `Session` es la fuente de verdad para el progreso del plan.
- Cada artefacto especializado referencia `session_id` (FK nullable hacia `sessions`).
- Crear un artefacto especializado SIN sesión previa sigue siendo válido (flujo legacy/directo).

---

## Prerequisitos

- Episodio en estado `abierto` o `en_tratamiento`.
- Plan en estado `activo` (para sesiones asociadas a plan).

---

## Tipos de sesión — `TipoSesion`

| Valor               | Artefacto clínico vinculado | Descripción                         |
|---------------------|-----------------------------|-------------------------------------|
| `FISIOTERAPIA`      | `SoapNote`                  | Sesión de fisioterapia con SOAP     |
| `EVALUACION_FISICA` | `PhysicalEvaluation`        | Evaluación funcional/ROM/fuerza     |
| `INTERCONSULTA`     | `Interconsult`              | Derivación a otro especialista      |
| `CONSULTA_MEDICA`   | *(futuro)*                  | Consulta médica directa             |

---

## Máquina de estados — `EstadoSesion`

```
PROGRAMADA ──→ EN_CURSO ──→ COMPLETADA
     │                           
     └──────────────────→ CANCELADA
             EN_CURSO ──→ CANCELADA
```

| Transición | Quién | Condición |
|---|---|---|
| `PROGRAMADA → EN_CURSO` | Sistema (auto) al crear artefacto vinculado | — |
| `EN_CURSO → COMPLETADA` | Profesional / Sistema (auto al completar artefacto) | — |
| `PROGRAMADA → CANCELADA` | WRITERS | — |
| `EN_CURSO → CANCELADA` | WRITERS | — |
| `COMPLETADA → *` | ❌ inmutable | — |

---

## Entidad `Session` (respuesta)

```typescript
{
  id: string
  planId: string | null            // null si sesión sin plan
  episodeId: string
  codigoHc: string                 // 'HC-2024-0037' desnormalizado
  pacienteId: string               // desnormalizado
  profesionalId: string
  tipo: TipoSesion                 // 'FISIOTERAPIA' | 'EVALUACION_FISICA' | 'INTERCONSULTA' | 'CONSULTA_MEDICA'
  estado: EstadoSesion             // 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
  numeroSesion: number             // correlativo por plan (atómico MAX+1)
  fechaSesion: string              // 'YYYY-MM-DD'
  appointmentId: string | null     // FK → appointments (si viene de cita agendada)
  // artefactos — solo en GET detalle, null en listado
  soapNote: SoapNote | null        // cargado si tipo=FISIOTERAPIA
  physicalEval: PhysicalEvaluation | null  // cargado si tipo=EVALUACION_FISICA
  interconsult: Interconsult | null        // cargado si tipo=INTERCONSULTA
  observaciones: string | null
  createdAt: string
  updatedAt: string
}
```

---

## Rutas

```
# Sesiones de un plan
POST   /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions       WRITERS
GET    /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions       READERS
GET    /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid  READERS  ← carga artefacto
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid  WRITERS (autor/admin)
DELETE /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid  ADMIN    ← solo PROGRAMADA

# Sesiones de un episodio (todas, sin importar plan)
GET    /api/v1/patients/:patientId/episodes/:episodeId/sessions                     READERS
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA
- `ADMIN` = solo admin

---

## Crear sesión — `POST /plans/:planId/sessions`

**Body:**

```typescript
{
  tipo: TipoSesion               // requerido
  fechaSesion: string            // 'YYYY-MM-DD' requerido, no futura
  profesionalId: string          // uuid requerido
  appointmentId?: string         // uuid — vincular a cita confirmada
  observaciones?: string         // max 500
}
```

`numeroSesion` generado automático (`MAX + 1` por plan, atómico en transacción).  
`estado` inicial: `PROGRAMADA`.

**Respuesta:** `201` → `Session` sin artefactos (soapNote/physicalEval/interconsult = null).

**Errores:**

| Status | Condición |
|--------|-----------|
| `400` | `fechaSesion` futura o inválida |
| `404` | Paciente, episodio o plan no encontrado |
| `422` | Episodio o plan inactivo |

---

## Listar sesiones — `GET /plans/:planId/sessions`

**Query params:**

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | 1 | — |
| `limit` | number | 20 | max 50 |
| `estado` | EstadoSesion | — | Filtro por estado |
| `tipo` | TipoSesion | — | Filtro por tipo |
| `profesionalId` | uuid | — | Filtro por profesional |
| `desde` | string | — | `fechaSesion >= desde` (YYYY-MM-DD) |
| `hasta` | string | — | `fechaSesion <= hasta` (YYYY-MM-DD) |

**Respuesta:** `{ data: Session[], meta: { total, page, limit, pages } }`  
Listado **no carga artefactos** (soapNote/physicalEval/interconsult = null).

---

## Detalle sesión — `GET /plans/:planId/sessions/:sid`

Retorna `Session` con artefacto cargado según `tipo`:

```typescript
// Ejemplo tipo=FISIOTERAPIA
{
  ...session,
  soapNote: { id, numeroSesion, subjetivo, objetivo, analisis, plan, ... }
}
```

---

## PATCH sesión — `PATCH /plans/:planId/sessions/:sid`

Permite actualizar campos y/o transicionar estado manualmente.

```typescript
{
  fechaSesion?: string
  profesionalId?: string
  estado?: 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
  observaciones?: string
}
```

**Restricciones:**
- `estado = COMPLETADA` solo si ya existe artefacto vinculado (422 si no)
- Solo autor o admin (403)
- `COMPLETADA` → inmutable (422)
- Transición inválida → 422

---

## DELETE sesión — `DELETE /plans/:planId/sessions/:sid`

Solo `ADMIN`. Solo si `estado = PROGRAMADA` (422 en otro estado).  
Si existe artefacto vinculado → elimina también en cascada (o rechaza, según config).

---

## Progreso del plan — cálculo automático

Cuando una sesión pasa a `COMPLETADA` (manualmente o por sistema), el servicio recalcula:

```
sesionesEstimadas = plan.frecuenciaSemanal × plan.duracionEstimadaSemanas
sessionesCompletadas = COUNT(sessions WHERE plan_id=X AND estado='COMPLETADA')

progresoPorcentaje = MIN(100, ROUND(sessionesCompletadas / sesionesEstimadas × 100, 2))
```

Si `frecuenciaSemanal` o `duracionEstimadaSemanas` es `null` → `progresoPorcentaje` NO se recalcula automáticamente (permanece manual).

---

## Auto-transiciones por artefacto

| Evento | Transición en Session |
|---|---|
| Se crea `SoapNote` con `sessionId` | `PROGRAMADA → EN_CURSO` |
| Se crea `PhysicalEvaluation` con `sessionId` | `PROGRAMADA → EN_CURSO` |
| Se crea `Interconsult` con `sessionId` | `PROGRAMADA → EN_CURSO` |
| `PATCH session estado=COMPLETADA` | Requiere artefacto vinculado |

---

## Reglas de negocio

1. `numeroSesion` de solo lectura — auto-generado atómico por plan.
2. `fechaSesion` no puede ser futura al crear.
3. Sesión `COMPLETADA` → inmutable. Ni PATCH ni DELETE.
4. Solo puede haber **un artefacto por tipo** vinculado a una sesión (1 soap_note por sesión, no 2).
5. Un artefacto (`SoapNote`, `PhysicalEvaluation`) puede existir sin `sessionId` — flujo directo sigue válido.
6. `appointmentId` referencia una cita de tipo `SEGUIMIENTO` del mismo episodio/paciente (validado en service).
7. Progreso solo se recalcula si ambos campos `frecuenciaSemanal` y `duracionEstimadaSemanas` del plan están definidos.

---

## Impacto en tablas existentes

| Tabla | Cambio |
|---|---|
| `soap_notes` | Agregar `session_id UUID NULL FK → sessions ON DELETE SET NULL` |
| `physical_evaluations` | Agregar `session_id UUID NULL FK → sessions ON DELETE SET NULL` |
| `interconsults` | Agregar `session_id UUID NULL FK → sessions ON DELETE SET NULL` |
| `appointments` | Sin cambio — `sessions.appointment_id` apunta hacia allá |

> Datos existentes mantienen `session_id = NULL` — compatibilidad total con flujo sin sesión.

---

## Schema DB

```sql
CREATE TABLE sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NULL REFERENCES treatment_plans(id) ON DELETE RESTRICT,
  episode_id       UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
  codigo_hc        VARCHAR(15) NOT NULL,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  profesional_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tipo             VARCHAR(30) NOT NULL,
  estado           VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
  numero_sesion    INTEGER NOT NULL,
  fecha_sesion     DATE NOT NULL,
  appointment_id   UUID NULL REFERENCES appointments(id) ON DELETE SET NULL,
  observaciones    TEXT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_plan_id      ON sessions(plan_id);
CREATE INDEX idx_sessions_episode_id   ON sessions(episode_id);
CREATE INDEX idx_sessions_patient_id   ON sessions(patient_id);
CREATE INDEX idx_sessions_fecha_sesion ON sessions(fecha_sesion);
-- Unicidad: no dos sesiones con mismo numero en el mismo plan
CREATE UNIQUE INDEX uq_sessions_plan_numero ON sessions(plan_id, numero_sesion) WHERE plan_id IS NOT NULL;
```

---

## Cache Redis

| Clave | TTL | Invalidación |
|---|---|---|
| `session:id:{id}` | 300s | PATCH, artefacto creado/eliminado |

---

## Archivos backend a crear

```
src/modules/sessions/
  entities/session.entity.ts       — TipoSesion + EstadoSesion enums, relations
  dto/create-session.dto.ts
  dto/update-session.dto.ts
  dto/session-query.dto.ts
  sessions.service.ts              — CRUD + recalcular progreso plan
  sessions.controller.ts           ← /patients/:id/episodes/:id/plans/:id/sessions
  episode-sessions.controller.ts   ← /patients/:id/episodes/:id/sessions  (GET only)
  sessions.module.ts
src/database/migrations/1747440013000-CreateSessions.ts
src/database/migrations/1747440014000-AddSessionIdToArtifacts.ts
```
