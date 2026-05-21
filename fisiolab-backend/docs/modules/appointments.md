# Módulo: appointments (v2)

Agendamiento de citas clínicas. Trigger del flujo Historia Clínica (BPMN: `bpmn_appointments.txt`). Al completar una cita, el sistema genera automáticamente un `session_payment` con estado `PENDIENTE`.

---

## Patrón de diseño: State Pattern

`AppointmentStateFactory.get(estado)` resuelve la estrategia activa. Todos los endpoints llaman `assertCanXxx()` antes de ejecutar — no hay `if/else` dispersos en el service.

```
EstadoCita    cancel  complete  reschedule  noShow  patch
──────────────────────────────────────────────────────────
CONFIRMADA     ✅       ✅         ✅          ✅      ✅
CANCELADA      422      422        422         422    422
COMPLETADA     422      422        422         422    422
REPROGRAMADA   422      422        422         422    422   ← nuevo
NO_ASISTIO     422      422        422         422    422   ← nuevo
```

```typescript
// Todos los endpoints siguen el mismo patrón:
AppointmentStateFactory.get(appointment.estado).assertCanReschedule(); // lanza 422 si no
```

---

## Máquina de estados (v2)

```
CONFIRMADA ──→ COMPLETADA    POST /:id/complete
CONFIRMADA ──→ CANCELADA     POST /:id/cancel
CONFIRMADA ──→ REPROGRAMADA  POST /:id/reschedule  ← nuevo
CONFIRMADA ──→ NO_ASISTIO    POST /:id/no-show     ← nuevo
```

- Todos los estados finales son **inmutables** (422 en cualquier acción)
- `PATCH` solo funciona en `CONFIRMADA` (ajuste menor, sin audit trail)
- `POST /reschedule` = cambio formal con audit trail + cadena de citas

---

## Rutas

```
POST  /api/v1/appointments                           — crear cita            WRITERS
GET   /api/v1/appointments                           — listar global         READERS *
GET   /api/v1/appointments/:id                       — detalle               READERS
PATCH /api/v1/appointments/:id                       — ajuste menor          WRITERS (solo CONFIRMADA)
POST  /api/v1/appointments/:id/cancel                — cancelar              WRITERS
POST  /api/v1/appointments/:id/complete              — completar             WRITERS (profesional asignado o admin)
POST  /api/v1/appointments/:id/reschedule            — reprogramar           WRITERS   ← nuevo
POST  /api/v1/appointments/:id/no-show               — no asistió            WRITERS   ← nuevo

GET   /api/v1/patients/:patientId/appointments       — historial enriquecido READERS
```

\* Admin ve todas. MEDICO y FISIOTERAPEUTA ven solo las suyas. PASANTE: lectura de todas.

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `Appointment` (respuesta)

```typescript
{
  id: string
  patientId: string
  patient: { id, cedula, nombres, apellidos, genero }
  professionalId: string
  scheduledAt: string                   // ISO 8601
  durationMinutes: number               // default 60
  tipoCita: 'PRIMERA_VEZ' | 'SEGUIMIENTO' | 'INTERCONSULTA'
  estado: 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'REPROGRAMADA' | 'NO_ASISTIO'
  motivo: string | null
  notas: string | null
  motivoCancelacion: string | null
  episodeId: string | null
  sessionPaymentId: string | null
  // Campos de reprogramación (todos null si no es reprogramación)
  reprogramadaDeId: string | null       // UUID de la cita original que generó ésta
  nuevaCitaId: string | null            // UUID de la cita que reemplaza a ésta
  motivoReprogramacion: string | null
  createdAt: string
  updatedAt: string
}
```

---

## Crear cita — `POST /appointments`

**Body:**
```typescript
{
  patientId: string                     // uuid, requerido
  professionalId: string                // uuid, requerido
  scheduledAt: string                   // ISO 8601, requerido, no pasado
  tipoCita: 'PRIMERA_VEZ' | 'SEGUIMIENTO' | 'INTERCONSULTA'
  durationMinutes?: number              // 15-240, default 60
  motivo?: string                       // max 500
  notas?: string                        // max 1000
}
```

---

## Completar — `POST /:id/complete` (v2)

Tres casos según `tipoCita` y campos del body:

| Caso | tipoCita | episodeId | planId | Resultado |
|------|----------|-----------|--------|-----------|
| 1 | `PRIMERA_VEZ` | omitido | omitido | `episodeId = null` — profesional abre episodio después |
| 2 | `SEGUIMIENTO` / `INTERCONSULTA` | requerido | omitido | Vincula episodio, sin sesión automática |
| 3 | `SEGUIMIENTO` / `INTERCONSULTA` | requerido | requerido | Vincula episodio + **auto-crea `Session`** |

**Body:**
```typescript
{
  monto: number                         // > 0, requerido
  episodeId?: string                    // uuid — requerido en SEGUIMIENTO/INTERCONSULTA
  planId?: string                       // uuid — solo si hay plan activo; activa CASO 3
}
```

**Respuesta:**
```typescript
{
  appointment: Appointment              // estado COMPLETADA, sessionPaymentId poblado
  sessionId: string | null             // UUID de sesión auto-creada (CASO 3) o null
}
```

**Validaciones CASO 3:**
- `planId` requiere `episodeId` (400 si no)
- Plan debe pertenecer al episodio (404 si no)
- Plan debe estar en estado `activo` (422 si `completado` o `cancelado`)

**Acciones automáticas (todas en la misma transacción):**
1. `session_payment` creado: `{ appointmentId, monto, estadoPago: 'PENDIENTE' }`
2. `appointment.estado = COMPLETADA`
3. CASO 3: `Session` creada: `{ tipo: FISIOTERAPIA, estado: PROGRAMADA, fechaSesion: DATE(scheduledAt) }`

---

## Reprogramar — `POST /:id/reschedule` ← nuevo

**Body:**
```typescript
{
  scheduledAt: string                   // ISO 8601, requerido, no pasado
  motivo?: string                       // max 500 — guardado en motivoReprogramacion
}
```

**Lógica (transacción atómica con `SELECT FOR UPDATE`):**
1. Lock pesimista en cita original → previene race condition (TOCTOU)
2. Validar estado `CONFIRMADA` (422 si no)
3. Conflict check del nuevo horario **dentro de la transacción**
4. Crear nueva cita copiando `patientId, professionalId, durationMinutes, tipoCita, motivo, notas` con `reprogramadaDeId = original.id`
5. Marcar original: `estado = REPROGRAMADA`, `nuevaCitaId = nueva.id`, `motivoReprogramacion`
6. Invalida cache de ambas citas

**Respuesta `200 OK`:**
```typescript
{
  original: Appointment                 // estado REPROGRAMADA
  nueva: Appointment                    // estado CONFIRMADA, scheduledAt nuevo
}
```

**Cadena de reprogramaciones:**
```
appt-1 (REPROGRAMADA)  reprogramadaDeId=null   nuevaCitaId=appt-2
appt-2 (REPROGRAMADA)  reprogramadaDeId=appt-1  nuevaCitaId=appt-3
appt-3 (CONFIRMADA)    reprogramadaDeId=appt-2  nuevaCitaId=null
```

---

## No asistió — `POST /:id/no-show` ← nuevo

**Body:** vacío (no requiere campos)

**Lógica:**
1. Validar estado `CONFIRMADA` (422 si no)
2. `estado → NO_ASISTIO`
3. **NO se crea `SessionPayment`** — sin atención = sin cobro

**Respuesta:** `200 OK` → `Appointment` con `estado: NO_ASISTIO`

---

## Cancelar — `POST /:id/cancel`

```typescript
{ motivoCancelacion: string }           // min 5, max 500, requerido
```

---

## Historial por paciente — `GET /patients/:patientId/appointments`

Respuesta **enriquecida** con 2 queries (no N+1):
1. Query paginado TypeORM para los IDs
2. Batch JOIN para enriquecimiento de todos los IDs de una sola vez

```typescript
// Cada item en data[] incluye:
{
  ...Appointment,
  episode: { codigoHc, motivoConsulta, estado } | null
  session: { id, numeroSesion, estado, plan: { objetivoTerapeutico } | null } | null
  payment: { monto, estadoPago } | null
  reprogramadaDe: { id, scheduledAt } | null
  nuevaCita: { id, scheduledAt, estado } | null
}
```

**Query params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | int | default 1 |
| `limit` | int | max 100, default 20 |
| `estado` | enum | CONFIRMADA \| CANCELADA \| COMPLETADA \| REPROGRAMADA \| NO_ASISTIO |
| `tipoCita` | enum | PRIMERA_VEZ \| SEGUIMIENTO \| INTERCONSULTA |
| `desde` | YYYY-MM-DD | fecha inicio |
| `hasta` | YYYY-MM-DD | fecha fin |

---

## Reglas de negocio

1. `scheduledAt` no puede ser pasado al crear ni al reprogramar (400)
2. Conflicto horario: profesional con cita `CONFIRMADA` solapada → 409 `{ error: 'CONFLICT', overlapping: id }`
3. `PATCH` solo en `CONFIRMADA` — para ajustes menores sin registro de cambio
4. `POST /reschedule` — para cambio formal, genera cadena `reprogramadaDeId / nuevaCitaId`
5. `motivoCancelacion` requerido en `/cancel`
6. Solo el profesional asignado o admin puede llamar `/complete` (403)
7. `SessionPayment` auto-creado en `/complete` — `monto > 0`
8. `NO_ASISTIO` no genera `SessionPayment`
9. CASO 3: `planId` requiere plan activo en el episodio del paciente
10. Todos los estados excepto `CONFIRMADA` son **inmutables**

---

## Decisiones de diseño

### PATCH vs POST /reschedule
| | PATCH | POST /reschedule |
|--|-------|-----------------|
| Propósito | Ajuste menor (hora, duración) | Cambio formal de fecha |
| Audit trail | No | Sí (`motivoReprogramacion`) |
| Nuevo recurso | No | Sí (nueva cita CONFIRMADA) |
| Estado resultante | CONFIRMADA | Original=REPROGRAMADA, Nueva=CONFIRMADA |

### TOCTOU fix en reschedule
El conflict check ocurre **dentro de la transacción** con `SELECT FOR UPDATE` en la cita original. Dos requests concurrentes no pueden crear citas solapadas porque la segunda bloqueará hasta que la primera confirme o aborte.

### DIP: SessionsService inyectado en AppointmentsService
`SessionsModule` no importa `AppointmentsModule` → dependencia unidireccional. `createAutoSession(manager, data)` acepta el `EntityManager` del caller para participar en la misma transacción atómica.

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `appt:id:{id}` | 300s | PATCH, /cancel, /complete, /reschedule, /no-show |
| `appt:patient:{patientId}` | 300s | POST, PATCH, /cancel, /complete, /reschedule, /no-show |

---

## Migración

`1747440020000-AddRescheduleFieldsToAppointments.ts`

```sql
ALTER TYPE "estado_cita_enum" ADD VALUE IF NOT EXISTS 'REPROGRAMADA';
ALTER TYPE "estado_cita_enum" ADD VALUE IF NOT EXISTS 'NO_ASISTIO';

ALTER TABLE appointments
  ADD COLUMN reprogramada_de_id     uuid NULL REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN nueva_cita_id          uuid NULL REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN motivo_reprogramacion  varchar(500) NULL;
```

> PostgreSQL no permite eliminar valores de un enum — el `down()` solo elimina las columnas.

---

## Archivos backend

```
src/modules/appointments/
  interfaces/appointment-state.strategy.ts   ← abstract class
  states/
    confirmada.state.ts                       ← permite todo
    terminal.state.ts                         ← 422 en todo (reutilizado x4)
  factories/appointment-state.factory.ts
  entities/appointment.entity.ts             ← +2 enum values, +3 campos
  dto/
    create-appointment.dto.ts
    update-appointment.dto.ts
    cancel-appointment.dto.ts
    complete-appointment.dto.ts              ← añadido planId?
    complete-appointment-response.dto.ts     ← nuevo: { appointment, sessionId }
    reschedule-appointment.dto.ts            ← nuevo
    enriched-appointment.dto.ts              ← nuevo: interface con joins
    appointment-query.dto.ts                 ← enum actualizado (auto via EstadoCita)
  appointments.service.ts
  appointments.controller.ts                ← +POST /reschedule, +POST /no-show
  patient-appointments.controller.ts        ← retorna EnrichedAppointment
  appointments.module.ts                    ← importa SessionsModule

src/modules/sessions/
  sessions.service.ts                       ← añadido createAutoSession(manager, data)

src/database/migrations/
  1747440020000-AddRescheduleFieldsToAppointments.ts
```
