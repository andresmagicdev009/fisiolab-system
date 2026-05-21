# Módulo: exercises

Ejercicios prescritos dentro de un plan de tratamiento. Módulo independiente extraído de `treatment-plans`. Usa **Strategy Pattern** para validar prescripción según tipo de ejercicio.

---

## Patrón de diseño: Strategy

```
TipoEjercicio     validate()                        formatPrescripcion()
─────────────────────────────────────────────────────────────────────────
REPETICIONES    series o repeticiones requerido    "3 × 15 reps"
TIEMPO          duracionSegundos requerido         "3 × 30s" / "2m 30s"
CARDIO          duracionSegundos requerido         "20 min cardio"
LIBRE           sin restricciones                  "Libre"
```

`ExercisePrescriptionFactory.get(tipo)` resuelve la estrategia correcta. Usado en `create` y `update` del service.

---

## Rutas

```
# Nested bajo plan
GET    /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises           READERS
POST   /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises           WRITERS
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/reorder   WRITERS
PATCH  /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/:exId     WRITERS
DELETE /api/v1/patients/:patientId/episodes/:episodeId/plans/:planId/exercises/:exId     WRITERS
```

**Roles:**
- `READERS` = ADMIN, MEDICO, FISIOTERAPEUTA, PASANTE
- `WRITERS` = ADMIN, MEDICO, FISIOTERAPEUTA

---

## Entidad `Exercise` (respuesta)

```typescript
{
  id: string                       // uuid
  planId: string                   // uuid → treatment_plans
  tipoEjercicio: TipoEjercicio     // 'repeticiones' | 'tiempo' | 'cardio' | 'libre'
  nombre: string
  descripcion: string | null
  series: number | null            // smallint 1-20
  repeticiones: number | null      // smallint 1-100
  duracionSegundos: number | null  // smallint 1-3600
  orden: number                    // posición en plan, auto-incrementa
  observaciones: string | null
  createdAt: string                // ISO 8601
  updatedAt: string
}
```

---

## Crear — `POST`

**Body:**
```typescript
{
  tipoEjercicio?: TipoEjercicio    // default: 'repeticiones'
  nombre: string                   // min 2, max 255, requerido
  descripcion?: string             // max 2000
  series?: number                  // 1-20
  repeticiones?: number            // 1-100
  duracionSegundos?: number        // 1-3600
  observaciones?: string           // max 500
}
```

**Validación por tipo (Strategy):**
- `REPETICIONES` → series o repeticiones requerido (422 si ambos ausentes)
- `TIEMPO` → duracionSegundos requerido (422 si ausente)
- `CARDIO` → duracionSegundos requerido (422 si ausente)
- `LIBRE` → ningún campo requerido

**`orden`** auto-asignado: `MAX(orden) + 1` por plan.

**Prerequisitos:**
- Episodio en `abierto` o `en_tratamiento`
- Plan en estado `activo`

---

## Reorder — `PATCH /reorder`

**Body:**
```typescript
{
  orden: [
    { id: string, orden: number },
    ...
  ]
}
```

Solo autor del plan o admin. Actualiza posiciones en transacción atómica.

---

## Reglas de negocio

1. Plan `completado` o `cancelado` → ejercicios inmutables (422)
2. `orden` auto-asignado en create — no enviar
3. Reorder requiere enviar TODOS los ejercicios del plan con sus nuevas posiciones
4. Solo autor del plan o admin puede editar/eliminar/reordenar

---

## Cache Redis

| Clave | TTL | Invalidación |
|-------|-----|--------------|
| `plan:id:{id}` | 600s | POST/PATCH/DELETE exercise, reorder |

---

## Archivos backend

```
src/modules/exercises/
  interfaces/exercise-prescription.strategy.ts
  strategies/
    repeticion.strategy.ts
    tiempo.strategy.ts
    cardio.strategy.ts
    libre.strategy.ts
  factories/exercise-prescription.factory.ts
  entities/exercise.entity.ts
  dto/
    create-exercise.dto.ts
    update-exercise.dto.ts
    reorder-exercises.dto.ts
  exercises.service.ts
  exercises.controller.ts
  exercises.module.ts

src/database/migrations/1747440016000-AddTipoEjercicioToExercises.ts
```
