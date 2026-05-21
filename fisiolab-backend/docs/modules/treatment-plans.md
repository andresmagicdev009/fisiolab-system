# Módulo: treatment-plans + exercises

Planes de tratamiento fisioterapéutico asociados a un episodio clínico. Cada plan es una prescripción (objetivo, frecuencia, duración) con ejercicios ordenados y **sesiones** ejecutadas. El progreso se calcula automáticamente a partir de `sessions` completadas. Ver [sessions.md](./sessions.md).

---

## Prerequisitos

- Episodio clínico en estado `abierto` o `en_tratamiento`

---

## Rutas

```
# Plans
POST  /api/v1/patients/:patientId/episodes/:episodeId/plans                              WRITERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/plans                              READERS
GET   /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId                      READERS  ← incluye exercises[] + stats sesiones
PATCH /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId                      WRITERS (autor/admin)

# Exercises
POST   /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises           WRITERS
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/reorder   WRITERS (autor/admin)
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/:exId     WRITERS (autor/admin)
DELETE /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/:exId     WRITERS (autor/admin)

# Sessions — ver sessions.md para contrato completo
POST   /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions            WRITERS
GET    /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions            READERS
GET    /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid       READERS
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid       WRITERS (autor/admin)
DELETE /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/sessions/:sid       ADMIN (solo PROGRAMADA)
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `TreatmentPlan` (respuesta)

```typescript
{
  id: string
  episodeId: string
  codigoHc: string                      // 'HC-2024-0037' — desnormalizado
  pacienteId: string                    // desnormalizado
  profesionalId: string                 // quien creó el plan
  numeroPlan: number                    // 1, 2... atómico por episodio
  estado: 'activo' | 'completado' | 'cancelado'
  objetivoTerapeutico: string
  duracionEstimadaSemanas: number | null
  frecuenciaSemanal: number | null      // sesiones por semana
  fechaInicio: string | null            // 'YYYY-MM-DD'
  fechaFin: string | null               // 'YYYY-MM-DD'
  progresoPorcentaje: number            // 0-100, auto-calculado desde sessions COMPLETADAS (si frecuencia+duración definidas)
  observaciones: string | null
  exercises: Exercise[]                 // [] en listado, ordenados por orden ASC en GET /:planId
  // stats — solo en GET /:planId
  sesionesEstimadas: number | null      // frecuenciaSemanal × duracionEstimadaSemanas (null si alguno indefinido)
  sesionesCompletadas: number           // COUNT(sessions WHERE estado=COMPLETADA)
  createdAt: string
  updatedAt: string
}
```

## Entidad `Exercise` (respuesta)

```typescript
{
  id: string
  planId: string
  nombre: string
  descripcion: string | null
  series: number | null
  repeticiones: number | null
  duracionSegundos: number | null       // para ejercicios isométricos
  orden: number                         // posición en el plan
  observaciones: string | null
  createdAt: string
  updatedAt: string
}
```

---

## Máquina de estados del plan

```
activo → completado
activo → cancelado
```
- Plan `completado` o `cancelado` → inmutable (422 en PATCH plan y en ejercicios)

---

## Crear plan — `POST /plans`

**Body:**
```typescript
{
  profesionalId: string              // uuid, requerido
  objetivoTerapeutico: string        // min 10, max 1000, requerido
  duracionEstimadaSemanas?: number   // 1-52
  frecuenciaSemanal?: number         // 1-7
  fechaInicio?: string               // 'YYYY-MM-DD'
  fechaFin?: string                  // 'YYYY-MM-DD', debe ser >= fechaInicio
  observaciones?: string             // max 1000
}
```

`numeroPlan` generado automático (MAX+1 atómico por episodio). No enviar.

**Respuesta:** `201 Created` → `TreatmentPlan` con `exercises: []`

---

## PATCH plan

Todos los campos opcionales. Transiciones de estado solo `completado` | `cancelado`.

```typescript
{
  profesionalId?: string
  objetivoTerapeutico?: string
  duracionEstimadaSemanas?: number
  frecuenciaSemanal?: number
  fechaInicio?: string
  fechaFin?: string
  progresoPorcentaje?: number        // 0-100 — solo cuando sesionesEstimadas=null (manual). Ignorado si auto-calculable
  estado?: 'completado' | 'cancelado'
  observaciones?: string
}
```

**Restricciones:**
- Solo autor o admin (403)
- Plan ya `completado`/`cancelado` → 422
- Episodio `cerrado`/`archivado` → 422

---

## Crear ejercicio — `POST /plans/:planId/exercises`

**Body:**
```typescript
{
  nombre: string                     // min 2, max 255, requerido
  descripcion?: string               // max 2000
  series?: number                    // 1-20
  repeticiones?: number              // 1-100
  duracionSegundos?: number          // 1-3600
  observaciones?: string             // max 500
}
```

`orden` generado automático (MAX+1 por plan). No enviar.

**Restricciones:** plan debe ser `activo`, episodio debe ser `abierto`/`en_tratamiento`.

---

## PATCH reorder exercises — `PATCH /plans/:planId/exercises/reorder`

```typescript
{
  orden: Array<{ id: string; orden: number }>  // ids de ejercicios del plan con nuevo orden
}
```

Retorna lista completa de ejercicios ordenados. Autor o admin.

---

## Reglas de negocio

1. `numeroPlan` de solo lectura — auto-generado
2. `orden` en ejercicio de solo lectura en create — usar reorder para cambiar
3. Plan `completado`/`cancelado` → no se pueden agregar, editar ni eliminar ejercicios (422)
4. `fechaFin` debe ser ≥ `fechaInicio` si ambos presentes (400)
5. GET listado devuelve `exercises: []` — no carga ejercicios para evitar N+1
6. GET detalle carga `exercises` ordenados por `orden ASC` + `sesionesEstimadas` y `sesionesCompletadas`
7. `progresoPorcentaje` auto-calculado al completar sesión — solo manual si `frecuenciaSemanal` o `duracionEstimadaSemanas` son null
8. Sesiones del plan gestionadas en módulo `sessions` — ver [sessions.md](./sessions.md)

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `plan:id:{id}` | 600s | PATCH plan, POST/PATCH/DELETE/reorder exercise |

---

## Archivos backend

```
src/modules/treatment-plans/
  entities/treatment-plan.entity.ts  — EstadoPlan enum + OneToMany exercises
  entities/exercise.entity.ts
  dto/create-plan.dto.ts             — profesionalId + objetivoTerapeutico req; validación fechaFin >= fechaInicio
  dto/update-plan.dto.ts             — PartialType + estado (solo completado|cancelado) + progresoPorcentaje
  dto/plan-query.dto.ts              — page, limit, estado, profesionalId
  dto/create-exercise.dto.ts         — nombre req, resto opcional
  dto/update-exercise.dto.ts         — PartialType de create
  dto/reorder-exercises.dto.ts       — Array<{ id, orden }>
  treatment-plans.service.ts
  treatment-plans.controller.ts      ← /patients/:id/episodes/:id/plans
  treatment-plans.module.ts

src/database/migrations/1747440010000-CreateTreatmentPlans.ts
```
